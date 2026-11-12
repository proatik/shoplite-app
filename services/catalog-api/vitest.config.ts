import { resolve } from 'node:path';

import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

import { resolveTestConnections } from './vitest.test-env';

const connections = resolveTestConnections();

export default defineConfig({
  plugins: [swc.vite()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.spec.ts'],
          exclude: ['src/**/*.integration.spec.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.integration.spec.ts'],
          fileParallelism: false,
          globalSetup: ['./vitest.global-setup.ts'],
          env: {
            REDIS_URL: connections.redisUrl,
            POSTGRES_URL: connections.databaseUrl
          }
        }
      }
    ]
  }
});
