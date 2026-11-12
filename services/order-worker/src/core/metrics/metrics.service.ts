import { Injectable } from '@nestjs/common';

import { Counter, Histogram, createMetricsRegistry } from '@shoplite/shared';

import { SERVICE_NAME } from '@/service.constants';

import type { MetricsRegistry } from '@shoplite/shared';

export const ORDER_RESULTS = ['completed', 'failed', 'error'] as const;

export type OrderResult = (typeof ORDER_RESULTS)[number];

const PROCESSING_BUCKETS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];

@Injectable()
export class MetricsService {
  readonly registry: MetricsRegistry = createMetricsRegistry(SERVICE_NAME);

  private readonly ordersProcessed = new Counter({
    name: 'orders_processed_total',
    help: 'Orders the worker finished, by result.',
    labelNames: ['result'] as const,
    registers: [this.registry]
  });

  private readonly orderProcessing = new Histogram<'trace_id'>({
    name: 'order_processing_seconds',
    help: 'Time the worker spent processing one order.',
    buckets: PROCESSING_BUCKETS,
    enableExemplars: true,
    registers: [this.registry]
  });

  // every result starts at 0, so alerts see a series before the first order.
  constructor() {
    for (const result of ORDER_RESULTS) {
      this.ordersProcessed.inc({ result }, 0);
    }
  }

  recordOrder(result: OrderResult, seconds: number, traceId?: string): void {
    this.ordersProcessed.inc({ result });
    this.orderProcessing.observe({
      value: seconds,
      exemplarLabels: traceId ? { trace_id: traceId } : undefined
    });
  }
}
