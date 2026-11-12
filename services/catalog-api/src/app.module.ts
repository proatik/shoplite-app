import { Module } from '@nestjs/common';

import { RedisModule } from '@/core/redis/redis.module';
import { ChaosModule } from '@/core/chaos/chaos.module';
import { HealthModule } from '@/core/health/health.module';
import { MetricsModule } from '@/core/metrics/metrics.module';
import { AppConfigModule } from '@/core/config/config.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { DatabaseModule } from '@/core/database/database.module';
import { OrderQueueModule } from '@/core/queue/order-queue.module';
import { ProductsModule } from '@/modules/products/products.module';

@Module({
  imports: [
    RedisModule,
    ChaosModule,
    HealthModule,
    OrdersModule,
    MetricsModule,
    ProductsModule,
    DatabaseModule,
    AppConfigModule,
    OrderQueueModule
  ]
})
export class AppModule {}
