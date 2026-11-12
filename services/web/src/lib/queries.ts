import { skipToken, queryOptions } from '@tanstack/react-query';

import { getOrder, getProduct, listProducts } from '@/lib/api';

export const productsQuery = () =>
  queryOptions({ queryKey: ['products'], queryFn: listProducts });

export const productQuery = (id: number | undefined) =>
  queryOptions({
    queryKey: ['products', id],
    queryFn: id === undefined ? skipToken : () => getProduct(id)
  });

const POLL_INTERVAL_MS = 2000;

export const orderQuery = (id: number) =>
  queryOptions({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === 'PENDING' || status === 'PROCESSING'
        ? POLL_INTERVAL_MS
        : false;
    }
  });
