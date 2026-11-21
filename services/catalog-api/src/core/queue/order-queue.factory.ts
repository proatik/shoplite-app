import { SQSClient } from '@aws-sdk/client-sqs';

import { OrderQueue } from '@/core/queue/order-queue';
import { EnvService } from '@/core/config/env.service';
import { RedisService } from '@/core/redis/redis.service';
import { SqsOrderQueue } from '@/core/queue/sqs-order-queue';
import { RedisOrderQueue } from '@/core/queue/redis-order-queue';

export function createOrderQueue(
  env: EnvService,
  redis: RedisService
): OrderQueue {
  return env.queueBackend === 'sqs'
    ? new SqsOrderQueue(env.sqsQueueName, new SQSClient({}))
    : new RedisOrderQueue(redis);
}
