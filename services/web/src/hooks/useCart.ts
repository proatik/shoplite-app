import { useSyncExternalStore } from 'react';

import { useToast } from '@/hooks/useToast';
import {
  addItem,
  cartStore,
  cartCount,
  removeItems,
  setItemQuantity
} from '@/lib/cart';

import type { CartItem } from '@/lib/cart';

const BLOCKED_MESSAGE =
  "Your browser is blocking storage, so your cart can't be saved.";

export function useCart() {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot
  );
  const toast = useToast();

  function save(next: readonly CartItem[]) {
    if (!cartStore.save(next)) {
      toast(BLOCKED_MESSAGE);
    }
  }

  return {
    items,
    count: cartCount(items),
    add: (productId: number, quantity: number, max: number) =>
      save(addItem(cartStore.getSnapshot(), productId, quantity, max)),
    setQuantity: (productId: number, quantity: number) =>
      save(setItemQuantity(cartStore.getSnapshot(), productId, quantity)),
    remove: (productIds: readonly number[]) =>
      save(removeItems(cartStore.getSnapshot(), productIds))
  };
}
