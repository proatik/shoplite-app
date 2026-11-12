import { Global, Module } from '@nestjs/common';

import { OrderQueueService } from '@/core/queue/order-queue.service';

@Global()
@Module({
  providers: [OrderQueueService],
  exports: [OrderQueueService]
})
export class OrderQueueModule {}
