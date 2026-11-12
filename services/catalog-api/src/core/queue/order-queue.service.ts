import { Injectable } from '@nestjs/common';
import { SpanKind } from '@opentelemetry/api';

import { traced, ORDER_QUEUE_KEY, captureTraceContext } from '@shoplite/shared';

import { RedisService } from '@/core/redis/redis.service';

import type { OrderMessage } from '@shoplite/shared';

@Injectable()
export class OrderQueueService {
  constructor(private readonly redis: RedisService) {}

  async publish(orderId: number): Promise<void> {
    await traced(
      `${ORDER_QUEUE_KEY} publish`,
      {
        kind: SpanKind.PRODUCER,
        attributes: {
          'messaging.system': 'redis',
          'messaging.destination.name': ORDER_QUEUE_KEY,
          'order.id': orderId
        }
      },
      async () => {
        // captured inside the publish span, so the worker continues the trace.
        const message: OrderMessage = {
          order_id: orderId,
          trace_context: captureTraceContext() ?? undefined
        };

        await this.redis.client.lpush(ORDER_QUEUE_KEY, JSON.stringify(message));
      }
    );
  }
}
