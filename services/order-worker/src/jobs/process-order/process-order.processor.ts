import { setTimeout as sleep } from 'node:timers/promises';

import { Injectable } from '@nestjs/common';
import { SpanKind } from '@opentelemetry/api';

import {
  traced,
  createLogger,
  ORDER_QUEUE_KEY,
  OrderMessageSchema,
  restoreTraceContext
} from '@shoplite/shared';

import { RedisService } from '@/core/redis/redis.service';
import { MetricsService } from '@/core/metrics/metrics.service';
import { ProcessOrderService } from '@/jobs/process-order/process-order.service';
import {
  RETRY_DELAY_MS,
  POP_TIMEOUT_SECONDS
} from '@/jobs/process-order/process-order.constants';

import type { Redis } from 'ioredis';
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
  private loop: Promise<void> = Promise.resolve();
  private connection: Redis | undefined;

  constructor(
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
    private readonly processor: ProcessOrderService
  ) {}

  onApplicationBootstrap(): void {
    // a blocking BRPOP needs its own connection.
    this.connection = this.redis.client.duplicate();
    this.running = true;
    this.loop = this.consume(this.connection);
    this.logger.log('order consumer started', { queue: ORDER_QUEUE_KEY });
  }

  async beforeApplicationShutdown(): Promise<void> {
    this.running = false;
    await this.loop;
    await this.connection?.quit();
    this.logger.log('order consumer stopped');
  }

  private async consume(connection: Redis): Promise<void> {
    while (this.running) {
      try {
        const popped = await connection.brpop(
          ORDER_QUEUE_KEY,
          POP_TIMEOUT_SECONDS
        );

        if (popped) {
          await this.handle(popped[1]);
        }
      } catch (error) {
        this.logger.error('order queue read failed', error);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  private async handle(raw: string): Promise<void> {
    const message = OrderMessageSchema.safeParse(parseJson(raw));

    if (!message.success) {
      this.logger.error('order message rejected', message.error, { raw });

      return;
    }

    const orderId = message.data.order_id;

    await traced(
      'order.process',
      {
        kind: SpanKind.CONSUMER,
        attributes: {
          'messaging.system': 'redis',
          'messaging.destination.name': ORDER_QUEUE_KEY,
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
