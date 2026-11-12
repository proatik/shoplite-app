import { placeOrder } from '@/lib/api';

import type { CartLine } from '@/lib/cart';

export type PlaceFailure = { name: string; message: string };

export type PlaceResult = {
  placedIds: number[];
  placedProductIds: number[];
  failures: PlaceFailure[];
};

export async function placeLines(
  lines: readonly CartLine[],
  onPlaced: (orderId: number) => void
): Promise<PlaceResult> {
  const result: PlaceResult = {
    placedIds: [],
    placedProductIds: [],
    failures: []
  };

  for (const line of lines) {
    try {
      const order = await placeOrder(line.productId, line.quantity);

      result.placedIds.push(order.id);
      result.placedProductIds.push(line.productId);
      onPlaced(order.id);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      result.failures.push({
        name: line.product?.name ?? `Product #${line.productId}`,
        message: error.message
      });
    }
  }

  return result;
}
