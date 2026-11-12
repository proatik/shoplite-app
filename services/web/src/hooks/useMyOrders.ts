import { useSyncExternalStore } from 'react';

import { useToast } from '@/hooks/useToast';
import { ordersStore, prependOrder } from '@/lib/my-orders';

const BLOCKED_MESSAGE =
  "Your browser is blocking storage, so this order can't be added to My orders.";

export function useMyOrders() {
  const orders = useSyncExternalStore(
    ordersStore.subscribe,
    ordersStore.getSnapshot
  );
  const toast = useToast();

  return {
    orders,
    record: (id: number) => {
      const next = prependOrder(
        ordersStore.getSnapshot(),
        id,
        new Date().toISOString()
      );

      if (!ordersStore.save(next)) {
        toast(BLOCKED_MESSAGE);
      }
    }
  };
}
