import { Global, Module } from '@nestjs/common';

import { OrderQueue } from '@/core/queue/order-queue';
import { EnvService } from '@/core/config/env.service';
import { RedisService } from '@/core/redis/redis.service';
import { createOrderQueue } from '@/core/queue/order-queue.factory';
import { OrderQueueService } from '@/core/queue/order-queue.service';

@Global()
@Module({
  providers: [
    OrderQueueService,
    {
      provide: OrderQueue,
      inject: [EnvService, RedisService],
      useFactory: createOrderQueue
    }
  ],
  exports: [OrderQueue, OrderQueueService]
})
export class OrderQueueModule {}
