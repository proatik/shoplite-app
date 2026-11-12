import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3030),
  REDIS_URL: z.url(),
  POSTGRES_URL: z.url(),
  POSTGRES_POOL_MAX: z.coerce.number().int().min(1).default(5)
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.loose().parse(config);
}
