import { z } from 'zod';

import { QUEUE_BACKENDS } from '@shoplite/shared';

export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3030),
  REDIS_URL: z.url(),
  POSTGRES_URL: z.url(),
  POSTGRES_POOL_MAX: z.coerce.number().int().min(1).default(5),
  QUEUE_BACKEND: z.enum(QUEUE_BACKENDS).default('redis'),
  SQS_QUEUE_NAME: z.string().min(1).default('shoplite-orders'),
  SQS_CONFIRMED_QUEUE_NAME: z
    .string()
    .min(1)
    .default('shoplite-order-confirmed'),
  CHAOS_MEMORY_LEAK: z.stringbool().default(false),
  CHAOS_SLOW_DB: z.stringbool().default(false)
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.loose().parse(config);
}
