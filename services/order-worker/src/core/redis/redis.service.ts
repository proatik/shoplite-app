import { Redis } from 'ioredis';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';

import { createLogger } from '@shoplite/shared';

import { EnvService } from '@/core/config/env.service';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  readonly client: Redis;
  private readonly logger = createLogger(RedisService.name);

  constructor(env: EnvService) {
    this.client = new Redis(env.redisUrl);
    this.client.on('error', (error) => {
      this.logger.error('redis connection error', error);
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}
