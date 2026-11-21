import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '@/core/config/env.schema';
import type { QueueBackend } from '@shoplite/shared';

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

  get queueBackend(): QueueBackend {
    return this.get('QUEUE_BACKEND');
  }

  get sqsQueueName(): string {
    return this.get('SQS_QUEUE_NAME');
  }

  get sqsConfirmedQueueName(): string {
    return this.get('SQS_CONFIRMED_QUEUE_NAME');
  }

  get chaosMemoryLeak(): boolean {
    return this.get('CHAOS_MEMORY_LEAK');
  }

  get chaosSlowDb(): boolean {
    return this.get('CHAOS_SLOW_DB');
  }
}
