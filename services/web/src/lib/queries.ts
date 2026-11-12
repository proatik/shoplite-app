import { queryOptions } from '@tanstack/react-query';

import { listProducts } from '@/lib/api';

export const productsQuery = () =>
  queryOptions({ queryKey: ['products'], queryFn: listProducts });
