import { setTimeout as sleep } from 'node:timers/promises';

import { Injectable } from '@nestjs/common';
import { eq, and, gte, sql } from 'drizzle-orm';

import { dbSpan } from '@shoplite/shared';
import { orders, products } from '@shoplite/database';

import { DatabaseService } from '@/core/database/database.service';
import {
  MIN_PROCESSING_MS,
  PROCESSING_SPREAD_MS
} from '@/jobs/process-order/process-order.constants';

import type { OrderStatus } from '@shoplite/database';

export type ProcessedStatus = Extract<OrderStatus, 'COMPLETED' | 'FAILED'>;

@Injectable()
export class ProcessOrderService {
  constructor(private readonly database: DatabaseService) {}

  async process(orderId: number): Promise<ProcessedStatus | null> {
    // claim moves only a pending order, so a message seen twice runs once.
    if (!(await this.claim(orderId))) {
      return null;
    }

    await sleep(MIN_PROCESSING_MS + Math.random() * PROCESSING_SPREAD_MS);

    return await this.finish(orderId);
  }

  private async claim(orderId: number): Promise<boolean> {
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
}
