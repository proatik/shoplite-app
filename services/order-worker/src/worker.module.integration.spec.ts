import { Redis } from 'ioredis';
import { eq, sql } from 'drizzle-orm';
import { Test } from '@nestjs/testing';
import { setTimeout as sleep } from 'node:timers/promises';
import { it, expect, describe, afterAll, beforeAll } from 'vitest';

import { orders, products } from '@shoplite/database';
import { ORDER_QUEUE_KEY } from '@shoplite/shared';

import { WorkerModule } from '@/worker.module';
import { DatabaseService } from '@/core/database/database.service';

import type { INestApplication } from '@nestjs/common';
import type { EnvService } from '@/core/config/env.service';

const SHUTDOWN_TEST_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 50;
const PROCESSING_WAIT_MS = 5_000;

describe('WorkerModule shutdown (Postgres and Redis)', () => {
  const database = new DatabaseService({
    postgresUrl: process.env.POSTGRES_URL ?? '',
    postgresPoolMax: 2
  } as EnvService);
  const redis = new Redis(process.env.REDIS_URL ?? '');

  async function orderStatus(id: number): Promise<string> {
    const [row] = await database.db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, id));

    return row.status;
  }

  async function waitForStatus(id: number, status: string): Promise<void> {
    const deadline = Date.now() + PROCESSING_WAIT_MS;

    while ((await orderStatus(id)) !== status) {
      if (Date.now() > deadline) {
        throw new Error(`order ${id} never reached ${status}`);
      }

      await sleep(POLL_INTERVAL_MS);
    }
  }

  beforeAll(async () => {
    await database.db.execute(
      sql`truncate ${orders}, ${products} restart identity cascade`
    );
    await redis.del(ORDER_QUEUE_KEY);
  });

  afterAll(async () => {
    await redis.quit();
    await database.onApplicationShutdown();
  });

  it(
    'finishes the order in progress before closing its connections',
    async () => {
      const [product] = await database.db
        .insert(products)
        .values({
          name: 'Jamdani Saree',
          description: 'Handwoven muslin with a floral motif.',
          price: 1250000,
          stock: 2
        })
        .returning({ id: products.id });
      const [order] = await database.db
        .insert(orders)
        .values({ productId: product.id, quantity: 1 })
        .returning({ id: orders.id });

      const moduleRef = await Test.createTestingModule({
        imports: [WorkerModule]
      }).compile();
      const app: INestApplication = moduleRef.createNestApplication({
        logger: false
      });

      await app.init();
      await redis.lpush(
        ORDER_QUEUE_KEY,
        JSON.stringify({ order_id: order.id })
      );
      await waitForStatus(order.id, 'PROCESSING');

      // the same path a SIGTERM takes: the order is mid-way when shutdown starts.
      await app.close();

      expect(await orderStatus(order.id)).toBe('COMPLETED');
    },
    SHUTDOWN_TEST_TIMEOUT_MS
  );
});
