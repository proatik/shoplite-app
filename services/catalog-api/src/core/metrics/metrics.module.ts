import { Global, Module } from '@nestjs/common';

import { MetricsService } from '@/core/metrics/metrics.service';
import { MetricsController } from '@/core/metrics/metrics.controller';
import { HttpMetricsMiddleware } from '@/core/metrics/http-metrics.middleware';

import type { NestModule, MiddlewareConsumer } from '@nestjs/common';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService]
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpMetricsMiddleware).forRoutes('{*splat}');
  }
}
