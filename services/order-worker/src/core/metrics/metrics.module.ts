import { Global, Module } from '@nestjs/common';

import { MetricsService } from '@/core/metrics/metrics.service';
import { MetricsController } from '@/core/metrics/metrics.controller';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService]
})
export class MetricsModule {}
