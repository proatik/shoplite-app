import { Injectable } from '@nestjs/common';
import { SpanKind } from '@opentelemetry/api';

import { traced, captureTraceContext } from '@shoplite/shared';

import { OrderQueue } from '@/core/queue/order-queue';

import type { OrderMessage } from '@shoplite/shared';

@Injectable()
export class OrderQueueService {
  constructor(private readonly queue: OrderQueue) {}

  async publish(orderId: number): Promise<void> {
    await traced(
      `${this.queue.name} publish`,
      {
        kind: SpanKind.PRODUCER,
        attributes: {
          'messaging.system': this.queue.system,
          'messaging.destination.name': this.queue.name,
          'order.id': orderId
        }
      },
      async () => {
        // captured inside the publish span, so the worker continues the trace.
        const message: OrderMessage = {
          order_id: orderId,
          trace_context: captureTraceContext() ?? undefined
        };

        await this.queue.push(JSON.stringify(message));
      }
    );
  }
}
