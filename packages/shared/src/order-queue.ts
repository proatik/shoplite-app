import { z } from 'zod';

import { TraceContextSchema } from './trace-context';

export const ORDER_QUEUE_KEY = 'orders:pending';

export const OrderMessageSchema = z.object({
  order_id: z.number().int().positive(),
  trace_context: TraceContextSchema.optional()
});

export type OrderMessage = z.infer<typeof OrderMessageSchema>;
