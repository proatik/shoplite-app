import { Module } from '@nestjs/common';

import { RedisModule } from '@/core/redis/redis.module';
import { HealthModule } from '@/core/health/health.module';
import { MetricsModule } from '@/core/metrics/metrics.module';
import { AppConfigModule } from '@/core/config/config.module';
import { DatabaseModule } from '@/core/database/database.module';
import { ProcessOrderModule } from '@/jobs/process-order/process-order.module';

@Module({
  imports: [
    RedisModule,
    HealthModule,
    MetricsModule,
    DatabaseModule,
    AppConfigModule,
    ProcessOrderModule
  ]
})
export class WorkerModule {}
