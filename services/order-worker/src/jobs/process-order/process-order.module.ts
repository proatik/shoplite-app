import { Module } from '@nestjs/common';

import { ProcessOrderService } from '@/jobs/process-order/process-order.service';
import { ProcessOrderProcessor } from '@/jobs/process-order/process-order.processor';

@Module({
  providers: [ProcessOrderService, ProcessOrderProcessor]
})
export class ProcessOrderModule {}
