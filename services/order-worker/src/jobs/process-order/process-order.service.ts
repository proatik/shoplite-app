import { setTimeout as sleep } from 'node:timers/promises';

import { Injectable } from '@nestjs/common';
import { eq, and, gte, sql } from 'drizzle-orm';
import { SpanKind } from '@opentelemetry/api';

import { dbSpan, traced } from '@shoplite/shared';
import { orders, products } from '@shoplite/database';

import { EnvService } from '@/core/config/env.service';
import { DatabaseService } from '@/core/database/database.service';
import {
  MIN_PROCESSING_MS,
  PROCESSING_SPREAD_MS,
  LEAKED_BYTES_PER_ORDER
} from '@/jobs/process-order/process-order.constants';

import type { OrderStatus } from '@shoplite/database';

export type ProcessedStatus = Extract<OrderStatus, 'COMPLETED' | 'FAILED'>;

@Injectable()
export class ProcessOrderService {
  private readonly leaked: Buffer[] = [];

  constructor(
    private readonly env: EnvService,
    private readonly database: DatabaseService
  ) {}

  async process(orderId: number): Promise<ProcessedStatus | null> {
    // claim moves only a pending order, so a message seen twice runs once.
    if (!(await this.claim(orderId))) {
      return null;
    }

    await sleep(MIN_PROCESSING_MS + Math.random() * PROCESSING_SPREAD_MS);

    const status = await this.finish(orderId);

    if (this.env.chaosMemoryLeak) {
      this.leaked.push(Buffer.alloc(LEAKED_BYTES_PER_ORDER, orderId));
    }

    return status;
  }

  private async claim(orderId: number): Promise<boolean> {
    await this.slowDownIfAsked();

    const claimed = await dbSpan(
      'UPDATE',
      'orders',
      async () =>
        await this.database.db
          .update(orders)
          .set({ status: 'PROCESSING' })
          .where(and(eq(orders.id, orderId), eq(orders.status, 'PENDING')))
          .returning({ id: orders.id })
    );

    return claimed.length > 0;
  }

  private async finish(orderId: number): Promise<ProcessedStatus> {
    await this.slowDownIfAsked();

    return await dbSpan(
      'UPDATE',
      'orders',
      async () =>
        await this.database.db.transaction(async (tx) => {
          const [order] = await tx
            .select({ productId: orders.productId, quantity: orders.quantity })
            .from(orders)
            .where(eq(orders.id, orderId));

          const reserved = order
            ? await tx
                .update(products)
                .set({ stock: sql`${products.stock} - ${order.quantity}` })
                .where(
                  and(
                    eq(products.id, order.productId),
                    gte(products.stock, order.quantity)
                  )
                )
                .returning({ id: products.id })
            : [];

          const status: ProcessedStatus =
            reserved.length > 0 ? 'COMPLETED' : 'FAILED';

          await tx
            .update(orders)
            .set({ status, completedAt: new Date() })
            .where(eq(orders.id, orderId));

          return status;
        })
    );
  }

  // traced like any query, so a slow-db incident shows in the trace, not as a gap.
  private async slowDownIfAsked(): Promise<void> {
    if (!this.env.chaosSlowDb) {
      return;
    }

    await traced(
      'SELECT pg_sleep',
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'db.system.name': 'postgresql',
          'db.operation.name': 'SELECT',
          'db.query.text': 'select pg_sleep(2)'
        }
      },
      async () => await this.database.db.execute(sql`select pg_sleep(2)`)
    );
  }
}
