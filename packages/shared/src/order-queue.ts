import { z } from 'zod';

import { TraceContextSchema } from './trace-context';

export const ORDER_QUEUE_KEY = 'orders:pending';

export const QUEUE_BACKENDS = ['redis', 'sqs'] as const;

export const OrderMessageSchema = z.object({
  order_id: z.number().int().positive(),
  trace_context: TraceContextSchema.optional()
});

export const OrderConfirmedMessageSchema = z.object({
  order_id: z.number().int().positive(),
  status: z.literal('COMPLETED'),
  completed_at: z.iso.datetime()
});

export type QueueBackend = (typeof QUEUE_BACKENDS)[number];

export type OrderMessage = z.infer<typeof OrderMessageSchema>;

export type OrderConfirmedMessage = z.infer<typeof OrderConfirmedMessageSchema>;
