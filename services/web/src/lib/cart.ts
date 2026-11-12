import { isId, isRecord, createJsonStore } from '@/lib/storage';

import type { Product } from '@/lib/types';

export const MAX_QUANTITY = 100;

export type CartItem = { productId: number; quantity: number };

export type CartLine = CartItem & {
  product: Product | undefined;
  isAvailable: boolean;
  lineTotal: number;
};

const EMPTY_CART: readonly CartItem[] = [];

const isQuantity = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= MAX_QUANTITY;

const isCartItem = (value: unknown): value is CartItem =>
  isRecord(value) && isId(value.productId) && isQuantity(value.quantity);

function isCartItems(value: unknown): value is readonly CartItem[] {
  return (
    Array.isArray(value) &&
    value.every(isCartItem) &&
    new Set(value.map((item) => item.productId)).size === value.length
  );
}

export const cartStore = createJsonStore(
  'shoplite.cart',
  isCartItems,
  EMPTY_CART
);

export const setItemQuantity = (
  items: readonly CartItem[],
  productId: number,
  quantity: number
): readonly CartItem[] =>
  items.map((item) =>
    item.productId === productId ? { ...item, quantity } : item
  );

export function addItem(
  items: readonly CartItem[],
  productId: number,
  quantity: number,
  max: number
): readonly CartItem[] {
  const existing = items.find((item) => item.productId === productId);

  if (!existing) {
    return [...items, { productId, quantity: Math.min(quantity, max) }];
  }

  return setItemQuantity(
    items,
    productId,
    Math.min(existing.quantity + quantity, max)
  );
}

export const removeItems = (
  items: readonly CartItem[],
  productIds: readonly number[]
): readonly CartItem[] =>
  items.filter((item) => !productIds.includes(item.productId));

export const cartCount = (items: readonly CartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export const itemCountLabel = (count: number): string =>
  count === 1 ? '1 item' : `${count} items`;

export function resolveLines(
  items: readonly CartItem[],
  products: readonly Product[]
): CartLine[] {
  return items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);

    return {
      ...item,
      product,
      isAvailable: product !== undefined && product.stock >= item.quantity,
      lineTotal: product ? product.price * item.quantity : 0
    };
  });
}

export const cartTotal = (lines: readonly CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.lineTotal, 0);

export function cartAttention(
  lines: readonly CartLine[]
): { title: string; text: string } | null {
  const flagged = lines.filter((line) => !line.isAvailable);
  const [first] = flagged;

  if (!first) {
    return null;
  }

  if (flagged.length === 1) {
    const name = first.product?.name ?? `Product #${first.productId}`;

    return {
      title: 'One item needs your attention',
      text: `${name} isn't available in your quantity. Lower it or remove the line to check out.`
    };
  }

  return {
    title: `${flagged.length} items need your attention`,
    text: "The flagged lines aren't available in your quantities. Lower them or remove the lines to check out."
  };
}
