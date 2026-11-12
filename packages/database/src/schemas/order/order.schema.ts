import { sql } from 'drizzle-orm';
import {
  check,
  pgEnum,
  integer,
  pgTable,
  timestamp
} from 'drizzle-orm/pg-core';

import { products } from '../product/product.schema';

export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatus = pgEnum('order_status', ORDER_STATUSES);

export const orders = pgTable(
  'orders',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    status: orderStatus('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true })
  },
  (table) => [check('orders_quantity_positive', sql`${table.quantity} > 0`)]
);
