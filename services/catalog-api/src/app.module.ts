import { Module } from '@nestjs/common';

import { RedisModule } from '@/core/redis/redis.module';
import { ChaosModule } from '@/core/chaos/chaos.module';
import { HealthModule } from '@/core/health/health.module';
import { MetricsModule } from '@/core/metrics/metrics.module';
import { AppConfigModule } from '@/core/config/config.module';
import { DatabaseModule } from '@/core/database/database.module';
import { ProductsModule } from '@/modules/products/products.module';

@Module({
  imports: [
    RedisModule,
    ChaosModule,
    HealthModule,
    MetricsModule,
    ProductsModule,
    DatabaseModule,
    AppConfigModule
  ]
})
export class AppModule {}
