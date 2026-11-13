import { z } from 'zod';

import { MAX_ID, ORDER_STATUSES } from '@shoplite/database';

export const MAX_ORDER_QUANTITY = 100;

export const CreateOrderSchema = z.object({
  product_id: z.number().int().positive().max(MAX_ID),
  quantity: z.number().int().positive().max(MAX_ORDER_QUANTITY)
});

export type CreateOrder = z.infer<typeof CreateOrderSchema>;

export const OrderParamsSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_ID)
});

export type OrderParams = z.infer<typeof OrderParamsSchema>;

export const CreatedOrderSchema = z.object({
  id: z.number().int(),
  status: z.enum(ORDER_STATUSES)
});

export type CreatedOrder = z.infer<typeof CreatedOrderSchema>;

export const OrderSchema = z.object({
  id: z.number().int(),
  product_id: z.number().int(),
  quantity: z.number().int(),
  status: z.enum(ORDER_STATUSES),
  created_at: z.date(),
  completed_at: z.date().nullable()
});

export type Order = z.infer<typeof OrderSchema>;
