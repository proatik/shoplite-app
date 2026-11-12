import { eq, sql } from 'drizzle-orm';
import { Test } from '@nestjs/testing';
import {
  it,
  vi,
  expect,
  describe,
  afterAll,
  beforeAll,
  beforeEach
} from 'vitest';
import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';

import { ORDER_QUEUE_KEY } from '@shoplite/shared';
import { orders, products } from '@shoplite/database';

import { RedisModule } from '@/core/redis/redis.module';
import { ChaosModule } from '@/core/chaos/chaos.module';
import { RedisService } from '@/core/redis/redis.service';
import { MetricsModule } from '@/core/metrics/metrics.module';
import { AppConfigModule } from '@/core/config/config.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { OrdersService } from '@/modules/orders/orders.service';
import { DatabaseModule } from '@/core/database/database.module';
import { OrderQueueModule } from '@/core/queue/order-queue.module';
import { DatabaseService } from '@/core/database/database.service';

import type { TestingModule } from '@nestjs/testing';

describe('OrdersService (Postgres + Redis)', () => {
  let moduleRef: TestingModule;
  let service: OrdersService;
  let database: DatabaseService;
  let redis: RedisService;
  let productId: number;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        AppConfigModule,
        DatabaseModule,
        RedisModule,
        ChaosModule,
        MetricsModule,
        OrderQueueModule,
        OrdersModule
      ]
    }).compile();
    moduleRef.useLogger(false);

    service = moduleRef.get(OrdersService);
    database = moduleRef.get(DatabaseService);
    redis = moduleRef.get(RedisService);
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await database.db.execute(
      sql`truncate ${orders}, ${products} restart identity cascade`
    );
    await redis.client.del(ORDER_QUEUE_KEY);

    const [product] = await database.db
      .insert(products)
      .values({
        name: 'Jute Tote Bag',
        description: 'Sturdy golden-jute tote.',
        price: 45000,
        stock: 5
      })
      .returning({ id: products.id });

    productId = product.id;
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('saves a PENDING order and queues its id with the trace context', async () => {
    const created = await service.create({
      product_id: productId,
      quantity: 2
    });

    expect(created.status).toBe('PENDING');

    const [saved] = await database.db
      .select()
      .from(orders)
      .where(eq(orders.id, created.id));
    expect(saved).toMatchObject({ productId, quantity: 2, status: 'PENDING' });

    const queued = await redis.client.lrange(ORDER_QUEUE_KEY, 0, -1);
    expect(queued.map((raw) => JSON.parse(raw) as unknown)).toEqual([
      expect.objectContaining({ order_id: created.id })
    ]);
  });

  it('refuses an order larger than the stock without saving it', async () => {
    await expect(
      service.create({ product_id: productId, quantity: 6 })
    ).rejects.toThrow(ConflictException);

    expect(await database.db.select().from(orders)).toHaveLength(0);
  });

  it('refuses an order for an unknown product', async () => {
    await expect(
      service.create({ product_id: 9999, quantity: 1 })
    ).rejects.toThrow(NotFoundException);
  });

  it('marks the order FAILED when the queue rejects it', async () => {
    vi.spyOn(redis.client, 'lpush').mockRejectedValueOnce(
      new Error('redis down')
    );

    await expect(
      service.create({ product_id: productId, quantity: 1 })
    ).rejects.toThrow(ServiceUnavailableException);

    const [saved] = await database.db.select().from(orders);
    expect(saved.status).toBe('FAILED');
    expect(saved.completedAt).toBeInstanceOf(Date);
  });

  it('returns an order with the brief field names', async () => {
    const created = await service.create({
      product_id: productId,
      quantity: 1
    });

    await expect(service.findOne(created.id)).resolves.toMatchObject({
      id: created.id,
      product_id: productId,
      quantity: 1,
      status: 'PENDING',
      completed_at: null
    });
  });
});
