import { Module } from '@nestjs/common';

import { RedisModule } from '@/core/redis/redis.module';
import { ChaosModule } from '@/core/chaos/chaos.module';
import { HealthModule } from '@/core/health/health.module';
import { MetricsModule } from '@/core/metrics/metrics.module';
import { AppConfigModule } from '@/core/config/config.module';
import { DatabaseModule } from '@/core/database/database.module';

@Module({
  imports: [
    RedisModule,
    ChaosModule,
    HealthModule,
    MetricsModule,
    DatabaseModule,
    AppConfigModule
  ]
})
export class AppModule {}
