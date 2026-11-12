import { existsSync } from 'node:fs';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const TEST_DATABASE_SUFFIX = '_test';

const TEST_REDIS_DB_INDEX = '1';

const DEV_POSTGRES_URL =
  'postgresql://shoplite:shoplite-local@localhost:5432/shoplite';

const DEV_REDIS_URL = 'redis://localhost:6379';

export interface TestConnections {
  redisUrl: string;
  databaseUrl: string;
  databaseName: string;
  adminDatabaseUrl: string;
}

export function resolveTestConnections(): TestConnections {
  const devDatabaseUrl = process.env.POSTGRES_URL ?? DEV_POSTGRES_URL;
  const devRedisUrl = process.env.REDIS_URL ?? DEV_REDIS_URL;

  const database = new URL(devDatabaseUrl);
  const databaseName = `${database.pathname.slice(1)}${TEST_DATABASE_SUFFIX}`;

  database.pathname = `/${databaseName}`;

  const redis = new URL(devRedisUrl);

  redis.pathname = `/${TEST_REDIS_DB_INDEX}`;

  if (database.toString() === devDatabaseUrl) {
    throw new Error('Test database URL must differ from POSTGRES_URL.');
  }

  return {
    redisUrl: redis.toString(),
    databaseUrl: database.toString(),
    databaseName,
    adminDatabaseUrl: devDatabaseUrl
  };
}
