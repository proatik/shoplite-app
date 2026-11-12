import { ProductMedia } from '@/components/ProductMedia';
import { formatMoney, formatLineCalculation } from '@/lib/format';

import type { ReactNode } from 'react';
import type { Product } from '@/lib/types';

export function SummaryItem({
  productId,
  quantity,
  product,
  badge
}: {
  productId: number;
  quantity: number;
  product: Product | undefined;
  badge?: ReactNode;
}) {
  const name = product?.name ?? `Product #${productId}`;

  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-t border-border py-2.5 text-[13.5px] first:border-t-0 first:pt-0">
      <ProductMedia
        id={productId}
        name={name}
        imageUrl={product?.image_url ?? null}
        className="row-span-2 size-10 rounded-md [&_svg]:size-4"
      />
      <span className="flex min-w-0 items-center gap-2">
        <span title={name} className="truncate">
          {name}
        </span>
        {badge}
      </span>
      <span className="col-start-3 row-span-2 row-start-1 font-semibold tabular-nums">
        {product ? formatMoney(product.price * quantity) : null}
      </span>
      <span className="col-start-2 text-[12.5px] text-muted-foreground tabular-nums">
        {product
          ? formatLineCalculation(quantity, product.price)
          : `Qty ${quantity}`}
      </span>
    </div>
  );
}
