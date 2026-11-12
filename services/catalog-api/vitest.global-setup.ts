import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { resolveTestConnections } from './vitest.test-env';

const MIGRATIONS_FOLDER = '../../packages/database/drizzle';

export default async function setup(): Promise<void> {
  const connections = resolveTestConnections();

  await createDatabaseIfMissing(
    connections.adminDatabaseUrl,
    connections.databaseName
  );

  const client = postgres(connections.databaseUrl, { max: 1 });

  try {
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await client.end();
  }
}

async function createDatabaseIfMissing(
  adminDatabaseUrl: string,
  databaseName: string
): Promise<void> {
  const admin = postgres(adminDatabaseUrl, { max: 1 });

  try {
    const existing =
      await admin`select 1 from pg_database where datname = ${databaseName}`;

    if (existing.length === 0) {
      await admin.unsafe(`create database "${databaseName}"`);
    }
  } finally {
    await admin.end();
  }
}
