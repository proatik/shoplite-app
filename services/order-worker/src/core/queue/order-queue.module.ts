import { Global, Module } from '@nestjs/common';

import { OrderQueue } from '@/core/queue/order-queue';
import { EnvService } from '@/core/config/env.service';
import { RedisService } from '@/core/redis/redis.service';
import { createOrderQueue } from '@/core/queue/order-queue.factory';

@Global()
@Module({
  providers: [
    {
      provide: OrderQueue,
      inject: [EnvService, RedisService],
      useFactory: createOrderQueue
    }
  ],
  exports: [OrderQueue]
})
export class OrderQueueModule {}
