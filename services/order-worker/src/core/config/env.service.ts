import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '@/core/config/env.schema';

@Injectable()
export class EnvService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<T extends keyof Env>(key: T): Env[T] {
    return this.config.get(key, { infer: true });
  }

  get port(): number {
    return this.get('PORT');
  }

  get redisUrl(): string {
    return this.get('REDIS_URL');
  }

  get postgresUrl(): string {
    return this.get('POSTGRES_URL');
  }

  get postgresPoolMax(): number {
    return this.get('POSTGRES_POOL_MAX');
  }
}
