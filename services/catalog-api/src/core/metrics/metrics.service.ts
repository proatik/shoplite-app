import { Injectable } from '@nestjs/common';

import {
  Gauge,
  Counter,
  Histogram,
  createLogger,
  createMetricsRegistry
} from '@shoplite/shared';

import { SERVICE_NAME } from '@/service.constants';
import { OrderQueue } from '@/core/queue/order-queue';

import type { MetricsRegistry } from '@shoplite/shared';

const HTTP_DURATION_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5
];

@Injectable()
export class MetricsService {
  readonly registry: MetricsRegistry = createMetricsRegistry(SERVICE_NAME);

  readonly httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'HTTP requests the api answered.',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [this.registry]
  });

  // 'trace_id' only types the exemplar label; it is never a series label.
  readonly httpDuration = new Histogram<'method' | 'route' | 'trace_id'>({
    name: 'http_request_duration_seconds',
    help: 'Time the api took to answer an HTTP request.',
    labelNames: ['method', 'route'] as const,
    buckets: HTTP_DURATION_BUCKETS,
    enableExemplars: true,
    registers: [this.registry]
  });

  readonly ordersCreated = new Counter({
    name: 'orders_created_total',
    help: 'Orders saved as PENDING and pushed onto the queue.',
    registers: [this.registry]
  });

  private readonly logger = createLogger(MetricsService.name);

  constructor(queue: OrderQueue) {
    const logger = this.logger;

    new Gauge({
      name: 'order_queue_depth',
      help: `Orders waiting in the ${queue.name} queue.`,
      registers: [this.registry],
      async collect() {
        try {
          this.set(await queue.depth());
        } catch (error) {
          logger.warn('queue depth not read', {
            reason: error instanceof Error ? error.message : 'unknown'
          });
        }
      }
    });
  }
}
