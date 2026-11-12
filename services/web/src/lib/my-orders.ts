import { isId, isRecord, createJsonStore } from '@/lib/storage';

export type StoredOrder = { id: number; placedAt: string };

const EMPTY_ORDERS: readonly StoredOrder[] = [];

const isStoredOrder = (value: unknown): value is StoredOrder =>
  isRecord(value) &&
  isId(value.id) &&
  typeof value.placedAt === 'string' &&
  !Number.isNaN(Date.parse(value.placedAt));

function isStoredOrders(value: unknown): value is readonly StoredOrder[] {
  return (
    Array.isArray(value) &&
    value.every(isStoredOrder) &&
    new Set(value.map((order) => order.id)).size === value.length
  );
}

export const ordersStore = createJsonStore(
  'shoplite.orders',
  isStoredOrders,
  EMPTY_ORDERS
);

export const prependOrder = (
  orders: readonly StoredOrder[],
  id: number,
  placedAt: string
): readonly StoredOrder[] => [{ id, placedAt }, ...orders];
