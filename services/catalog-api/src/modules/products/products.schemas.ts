import { z } from 'zod';

export const ProductParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export type ProductParams = z.infer<typeof ProductParamsSchema>;

export const ProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string(),
  image_url: z.string().nullable(),
  price: z.number(),
  stock: z.number().int()
});

export type Product = z.infer<typeof ProductSchema>;
