import { Trash2 } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Link } from '@/components/Link';
import { MAX_QUANTITY } from '@/lib/cart';
import { formatMoney } from '@/lib/format';
import { ProductMedia } from '@/components/ProductMedia';
import { QuantityStepper } from '@/components/QuantityStepper';

import type { CartLine } from '@/lib/cart';

export const CART_LINE_CLASSES =
  'grid grid-cols-[56px_minmax(0,1fr)_auto_140px_28px] items-center gap-4 border-t border-border px-[18px] py-4 first:border-t-0';

export function CartLineRow({
  line,
  onQuantityChange,
  onRemove
}: {
  line: CartLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { product } = line;
  const name = product?.name ?? `Product #${line.productId}`;
  const href = `/products/${line.productId}`;
  const max = product ? Math.max(1, Math.min(product.stock, MAX_QUANTITY)) : 1;

  return (
    <div
      className={cn(CART_LINE_CLASSES, !line.isAvailable && 'bg-danger-soft')}
    >
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <ProductMedia
          id={line.productId}
          name={name}
          imageUrl={product?.image_url ?? null}
          dim={!line.isAvailable}
          className="size-14 rounded-md [&_svg]:size-5"
        />
      </Link>
      <div className="flex min-w-0 flex-col items-start">
        <Link
          href={href}
          className="max-w-full truncate font-semibold text-foreground no-underline hover:underline hover:underline-offset-3"
        >
          {name}
        </Link>
        {product ? (
          <div className="text-[12.5px] text-muted-foreground tabular-nums">
            {formatMoney(product.price)} each
          </div>
        ) : null}
        {line.isAvailable ? null : (
          <div className="mt-1 text-[12.5px] text-danger">
            {product
              ? 'Not enough stock for this quantity.'
              : 'This product is no longer available.'}
          </div>
        )}
      </div>
      <QuantityStepper
        value={line.quantity}
        max={max}
        label={`Quantity of ${name}`}
        onChange={onQuantityChange}
      />
      <div className="flex items-center justify-end font-semibold whitespace-nowrap tabular-nums">
        {product ? formatMoney(line.lineTotal) : null}
      </div>
      <button
        type="button"
        title={`Remove ${name}`}
        aria-label={`Remove ${name}`}
        onClick={onRemove}
        className="inline-grid size-7 shrink-0 cursor-pointer place-items-center rounded-md border border-transparent bg-transparent p-0 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
      >
        <Trash2 aria-hidden="true" />
      </button>
    </div>
  );
}
