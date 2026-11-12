import { Redis } from 'ioredis';
import { Injectable, OnModuleDestroy } from '@nestjs/common';

import { createLogger } from '@shoplite/shared';

import { EnvService } from '@/core/config/env.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;
  private readonly logger = createLogger(RedisService.name);

  constructor(env: EnvService) {
    this.client = new Redis(env.redisUrl);
    this.client.on('error', (error) => {
      this.logger.error('redis connection error', error);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
