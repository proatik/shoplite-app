import { eq } from 'drizzle-orm';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';

import { orders } from '@shoplite/database';
import { dbSpan, createLogger } from '@shoplite/shared';

import { MetricsService } from '@/core/metrics/metrics.service';
import { DatabaseService } from '@/core/database/database.service';
import { OrderQueueService } from '@/core/queue/order-queue.service';
import { ProductsService } from '@/modules/products/products.service';

import type {
  Order,
  CreateOrder,
  CreatedOrder
} from '@/modules/orders/orders.schemas';

const OUT_OF_STOCK = 'Out Of Stock';

@Injectable()
export class OrdersService {
  private readonly logger = createLogger(OrdersService.name);

  constructor(
    private readonly metrics: MetricsService,
    private readonly queue: OrderQueueService,
    private readonly database: DatabaseService,
    private readonly products: ProductsService
  ) {}

  async create(input: CreateOrder): Promise<CreatedOrder> {
    const product = await this.products.findOne(input.product_id);

    if (input.quantity > product.stock) {
      throw new ConflictException('Not enough stock for this product.', {
        description: OUT_OF_STOCK
      });
    }

    const [order] = await dbSpan(
      'INSERT',
      'orders',
      async () =>
        await this.database.db
          .insert(orders)
          .values({ productId: product.id, quantity: input.quantity })
          .returning({ id: orders.id, status: orders.status })
    );

    try {
      await this.queue.publish(order.id);
    } catch (error) {
      // an unqueued order is marked failed, so none stays pending forever.
      await this.markFailed(order.id);
      this.logger.error('order could not be queued', error, {
        order_id: order.id
      });

      throw new ServiceUnavailableException('The order queue is unavailable.');
    }

    this.metrics.ordersCreated.inc();
    this.logger.log('order created', {
      order_id: order.id,
      product_id: product.id,
      quantity: input.quantity
    });

    return order;
  }

  async findOne(id: number): Promise<Order> {
    const [order] = await dbSpan(
      'SELECT',
      'orders',
      async () =>
        await this.database.db.select().from(orders).where(eq(orders.id, id))
    );

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return {
      id: order.id,
      product_id: order.productId,
      quantity: order.quantity,
      status: order.status,
      created_at: order.createdAt,
      completed_at: order.completedAt
    };
  }

  private async markFailed(id: number): Promise<void> {
    await dbSpan(
      'UPDATE',
      'orders',
      async () =>
        await this.database.db
          .update(orders)
          .set({ status: 'FAILED', completedAt: new Date() })
          .where(eq(orders.id, id))
    );
  }
}
