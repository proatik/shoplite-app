import { Injectable } from '@nestjs/common';

import {
  Gauge,
  Counter,
  Histogram,
  ORDER_QUEUE_KEY,
  createMetricsRegistry
} from '@shoplite/shared';

import { SERVICE_NAME } from '@/service.constants';
import { RedisService } from '@/core/redis/redis.service';

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

  constructor(redis: RedisService) {
    new Gauge({
      name: 'order_queue_depth',
      help: `Orders waiting in the ${ORDER_QUEUE_KEY} list.`,
      registers: [this.registry],
      async collect() {
        this.set(await redis.client.llen(ORDER_QUEUE_KEY));
      }
    });
  }
}
