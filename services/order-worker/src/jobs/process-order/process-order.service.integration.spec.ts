import { eq, sql } from 'drizzle-orm';
import { it, expect, describe, afterAll, beforeAll, beforeEach } from 'vitest';

import { orders, products } from '@shoplite/database';

import { DatabaseService } from '@/core/database/database.service';
import { ProcessOrderService } from '@/jobs/process-order/process-order.service';

import type { EnvService } from '@/core/config/env.service';

const env = {
  postgresUrl: process.env.POSTGRES_URL ?? '',
  postgresPoolMax: 2
} as EnvService;

describe('ProcessOrderService (Postgres)', () => {
  const database = new DatabaseService(env);
  let productId: number;

  async function placeOrder(quantity: number): Promise<number> {
    const [order] = await database.db
      .insert(orders)
      .values({ productId, quantity })
      .returning({ id: orders.id });

    return order.id;
  }

  async function orderRow(id: number) {
    const [row] = await database.db
      .select()
      .from(orders)
      .where(eq(orders.id, id));

    return row;
  }

  async function stock(): Promise<number> {
    const [row] = await database.db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, productId));

    return row.stock;
  }

  beforeAll(async () => {
    await database.db.execute(sql`select 1`);
  });

  beforeEach(async () => {
    await database.db.execute(
      sql`truncate ${orders}, ${products} restart identity cascade`
    );

    const [product] = await database.db
      .insert(products)
      .values({
        name: 'Khadi Cotton Panjabi',
        description: 'Handspun khadi with wooden buttons.',
        price: 245000,
        stock: 3
      })
      .returning({ id: products.id });

    productId = product.id;
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('completes an order in 1 to 2 seconds and takes its stock', async () => {
    const processor = new ProcessOrderService(database);
    const id = await placeOrder(2);
    const started = Date.now();

    await expect(processor.process(id)).resolves.toBe('COMPLETED');

    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThanOrEqual(1000);
    expect(elapsed).toBeLessThan(3000);
    expect(await orderRow(id)).toMatchObject({ status: 'COMPLETED' });
    expect((await orderRow(id)).completedAt).toBeInstanceOf(Date);
    expect(await stock()).toBe(1);
  });

  it('fails an order when the stock ran out, leaving the stock as it was', async () => {
    const processor = new ProcessOrderService(database);
    const id = await placeOrder(3);

    await database.db.update(products).set({ stock: 1 });

    await expect(processor.process(id)).resolves.toBe('FAILED');
    expect((await orderRow(id)).status).toBe('FAILED');
    expect(await stock()).toBe(1);
  });

  it('skips an order that is no longer PENDING', async () => {
    const processor = new ProcessOrderService(database);
    const id = await placeOrder(1);

    await database.db
      .update(orders)
      .set({ status: 'COMPLETED' })
      .where(eq(orders.id, id));

    await expect(processor.process(id)).resolves.toBeNull();
    expect(await stock()).toBe(3);
  });
});
