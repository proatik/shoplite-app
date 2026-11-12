import { skipToken, queryOptions } from '@tanstack/react-query';

import { getProduct, listProducts } from '@/lib/api';

export const productsQuery = () =>
  queryOptions({ queryKey: ['products'], queryFn: listProducts });

export const productQuery = (id: number | undefined) =>
  queryOptions({
    queryKey: ['products', id],
    queryFn: id === undefined ? skipToken : () => getProduct(id)
  });
