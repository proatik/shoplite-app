import { ORDER_QUEUE_KEY } from '@shoplite/shared';

import type { OrderQueue } from '@/core/queue/order-queue';
import type { RedisService } from '@/core/redis/redis.service';

export class RedisOrderQueue implements OrderQueue {
  readonly system = 'redis';
  readonly name = ORDER_QUEUE_KEY;

  constructor(private readonly redis: RedisService) {}

  async push(body: string): Promise<void> {
    await this.redis.client.lpush(ORDER_QUEUE_KEY, body);
  }

  async depth(): Promise<number> {
    // an LLEN queued while redis is down would stall the whole scrape.
    if (this.redis.client.status !== 'ready') {
      throw new Error(`redis is not ready: ${this.redis.client.status}`);
    }

    return await this.redis.client.llen(ORDER_QUEUE_KEY);
  }

  async ping(): Promise<void> {
    await this.redis.client.ping();
  }
}
