import type { Order, Product, CreatedOrder } from '@/lib/types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export const listProducts = () => request<Product[]>('/products');

export const getProduct = (id: number) => request<Product>(`/products/${id}`);

export const getOrder = (id: number) => request<Order>(`/orders/${id}`);

export const placeOrder = (productId: number, quantity: number) =>
  request<CreatedOrder>('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity })
  });
