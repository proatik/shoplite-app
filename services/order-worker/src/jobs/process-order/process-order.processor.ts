import { setTimeout as sleep } from 'node:timers/promises';

import { Injectable } from '@nestjs/common';
import { SpanKind } from '@opentelemetry/api';

import {
  traced,
  createLogger,
  OrderMessageSchema,
  restoreTraceContext
} from '@shoplite/shared';

import { OrderQueue } from '@/core/queue/order-queue';
import { MetricsService } from '@/core/metrics/metrics.service';
import { ProcessOrderService } from '@/jobs/process-order/process-order.service';
import {
  RETRY_DELAY_MS,
  CONSUMERS_PER_POD
} from '@/jobs/process-order/process-order.constants';

import type { OrderConsumer } from '@/core/queue/order-queue';
import type { OrderResult } from '@/core/metrics/metrics.service';
import type {
  OnApplicationBootstrap,
  BeforeApplicationShutdown
} from '@nestjs/common';

@Injectable()
export class ProcessOrderProcessor
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = createLogger(ProcessOrderProcessor.name);
  private running = false;
  private loops: Promise<void>[] = [];
  private consumers: OrderConsumer[] = [];
  private readonly abort = new AbortController();

  constructor(
    private readonly queue: OrderQueue,
    private readonly metrics: MetricsService,
    private readonly processor: ProcessOrderService
  ) {}

  onApplicationBootstrap(): void {
    this.consumers = Array.from({ length: CONSUMERS_PER_POD }, () =>
      this.queue.createConsumer()
    );
    this.running = true;
    this.loops = this.consumers.map(
      async (consumer) => await this.consume(consumer)
    );
    this.logger.log('order consumers started', {
      queue: this.queue.name,
      consumers: CONSUMERS_PER_POD
    });
  }

  async beforeApplicationShutdown(): Promise<void> {
    this.running = false;
    this.abort.abort();
    await Promise.all(this.loops);
    await Promise.all(
      this.consumers.map(async (consumer) => await consumer.close())
    );
    this.logger.log('order consumers stopped');
  }

  private async consume(consumer: OrderConsumer): Promise<void> {
    while (this.running) {
      try {
        const received = await consumer.receive(this.abort.signal);

        if (received) {
          const isHandled = await this.handle(received.body);

          // a failed order stays queued, so the queue can redeliver it.
          if (isHandled) {
            await received.acknowledge();
          }
        }
      } catch (error) {
        this.logger.error('order queue read failed', error);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  private async handle(raw: string): Promise<boolean> {
    const message = OrderMessageSchema.safeParse(parseJson(raw));

    if (!message.success) {
      this.logger.error('order message rejected', message.error, { raw });

      return true;
    }

    const orderId = message.data.order_id;

    return await traced(
      'order.process',
      {
        kind: SpanKind.CONSUMER,
        attributes: {
          'messaging.system': this.queue.system,
          'messaging.destination.name': this.queue.name,
          'order.id': orderId
        }
      },
      async (span) => {
        const started = process.hrtime.bigint();
        const result = await this.processOrder(orderId);
        const seconds = Number(process.hrtime.bigint() - started) / 1e9;

        if (result) {
          span.setAttribute('order.result', result);
          this.metrics.recordOrder(result, seconds, span.spanContext().traceId);
        }

        if (result === 'completed') {
          await this.queue.confirm({
            order_id: orderId,
            status: 'COMPLETED',
            completed_at: new Date().toISOString()
          });
        }

        return result !== 'error';
      },
      restoreTraceContext(message.data.trace_context)
    );
  }

  private async processOrder(orderId: number): Promise<OrderResult | null> {
    try {
      const status = await this.processor.process(orderId);

      if (!status) {
        this.logger.warn('order skipped: not pending', { order_id: orderId });

        return null;
      }

      this.logger.log('order processed', { order_id: orderId, status });

      return status === 'COMPLETED' ? 'completed' : 'failed';
    } catch (error) {
      this.logger.error('order processing failed', error, {
        order_id: orderId
      });

      return 'error';
    }
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
