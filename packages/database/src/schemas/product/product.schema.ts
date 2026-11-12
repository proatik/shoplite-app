import { sql } from 'drizzle-orm';
import { text, check, integer, pgTable } from 'drizzle-orm/pg-core';

export const products = pgTable(
  'products',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull().unique(),
    description: text('description').notNull(),
    imageUrl: text('image_url'),
    price: integer('price').notNull(),
    stock: integer('stock').notNull()
  },
  (table) => [
    check('products_price_not_negative', sql`${table.price} >= 0`),
    check('products_stock_not_negative', sql`${table.stock} >= 0`)
  ]
);
