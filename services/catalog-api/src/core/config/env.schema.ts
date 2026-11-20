import { z } from 'zod';

import { QUEUE_BACKENDS } from '@shoplite/shared';

export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  REDIS_URL: z.url(),
  POSTGRES_URL: z.url(),
  POSTGRES_POOL_MAX: z.coerce.number().int().min(1).default(10),
  QUEUE_BACKEND: z.enum(QUEUE_BACKENDS).default('redis'),
  SQS_QUEUE_NAME: z.string().min(1).default('shoplite-orders'),
  CHAOS_LATENCY_MS: z.coerce.number().int().min(0).default(0),
  CHAOS_ERROR_RATE: z.coerce.number().min(0).max(1).default(0)
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.loose().parse(config);
}
