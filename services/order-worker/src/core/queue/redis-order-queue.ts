import { ORDER_QUEUE_KEY } from '@shoplite/shared';

import { POP_TIMEOUT_SECONDS } from '@/core/queue/order-queue.constants';

import type { Redis } from 'ioredis';
import type { RedisService } from '@/core/redis/redis.service';
import type {
  OrderQueue,
  OrderConsumer,
  ReceivedOrder
} from '@/core/queue/order-queue';

class RedisOrderConsumer implements OrderConsumer {
  constructor(private readonly connection: Redis) {}

  async receive(): Promise<ReceivedOrder | null> {
    const popped = await this.connection.brpop(
      ORDER_QUEUE_KEY,
      POP_TIMEOUT_SECONDS
    );

    // a popped order is already off the list, so there is nothing to delete.
    return popped
      ? { body: popped[1], acknowledge: () => Promise.resolve() }
      : null;
  }

  async close(): Promise<void> {
    await this.connection.quit();
  }
}

export class RedisOrderQueue implements OrderQueue {
  readonly system = 'redis';
  readonly name = ORDER_QUEUE_KEY;

  constructor(private readonly redis: RedisService) {}

  createConsumer(): OrderConsumer {
    // a blocking BRPOP holds its connection, so each consumer gets its own.
    return new RedisOrderConsumer(this.redis.client.duplicate());
  }

  // only the sqs backend announces completed orders.
  async confirm(): Promise<void> {
    await Promise.resolve();
  }

  async ping(): Promise<void> {
    await this.redis.client.ping();
  }
}
