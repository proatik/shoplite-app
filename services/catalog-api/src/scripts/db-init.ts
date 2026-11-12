import { z } from 'zod';
import postgres from 'postgres';
import { Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { products } from '@shoplite/database';
import { JsonLogger, createLogger } from '@shoplite/shared';

import { SEED_PRODUCTS } from '@/scripts/seed-products';

const logger = createLogger('DbInit');

const INIT_LOCK_KEY = 'shoplite-db-init';

async function bootstrap(): Promise<void> {
  Logger.overrideLogger(new JsonLogger('db-init'));

  const { POSTGRES_URL, MIGRATIONS_DIR } = z
    .object({ POSTGRES_URL: z.url(), MIGRATIONS_DIR: z.string().min(1) })
    .parse(process.env);

  // one connection, so the session lock, migrations and seed share it.
  const client = postgres(POSTGRES_URL, {
    max: 1,
    onnotice: (notice) =>
      logger.log('postgres notice', { notice: notice.message })
  });
  const db = drizzle(client);

  try {
    await client`select pg_advisory_lock(hashtext(${INIT_LOCK_KEY}))`;

    try {
      // the bundled script has no package folder to find the migrations in.
      await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
      logger.log('migrations applied');

      const seeded = await db
        .insert(products)
        .values(SEED_PRODUCTS)
        .onConflictDoNothing({ target: products.name })
        .returning({ id: products.id });

      logger.log('products seeded', { inserted: seeded.length });
    } finally {
      await client`select pg_advisory_unlock(hashtext(${INIT_LOCK_KEY}))`;
    }
  } finally {
    await client.end();
  }
}

bootstrap().catch((error: unknown) => {
  logger.error('database initialization failed', error);
  process.exit(1);
});
