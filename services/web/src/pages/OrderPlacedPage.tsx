import { Check } from 'lucide-react';
import { useQuery, useQueries } from '@tanstack/react-query';

import { Link } from '@/components/Link';
import { formatMoney } from '@/lib/format';
import { itemCountLabel } from '@/lib/cart';
import { Skeleton } from '@/components/Skeleton';
import { StateBox } from '@/components/StateBox';
import { useSearchParams } from '@/hooks/useRoute';
import { buttonClasses } from '@/components/Button';
import { SummaryItem } from '@/components/SummaryItem';
import { SummaryTotal } from '@/components/SummaryTotal';
import { orderQuery, productsQuery } from '@/lib/queries';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

function parseIds(value: string | null): number[] {
  return (value ?? '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id >= 1);
}

export function OrderPlacedPage() {
  const ids = parseIds(useSearchParams().get('ids'));
  const orderResults = useQueries({ queries: ids.map(orderQuery) });
  const productsResult = useQuery(productsQuery());
  const orders = orderResults.flatMap((result) =>
    result.data ? [result.data] : []
  );
  const products = productsResult.data;
  const failed = orderResults.find((result) => result.error);
  const error = failed?.error ?? productsResult.error;

  if (ids.length === 0) {
    return (
      <StateBox
        kind="not-found"
        title="No orders to show"
        description="Place an order from your cart and it shows up here."
        action={
          <Link href="/" className={buttonClasses({ variant: 'secondary' })}>
            Back to the catalogue
          </Link>
        }
      />
    );
  }

  if (error) {
    return (
      <StateBox
        kind="load-failed"
        title="Couldn't load your orders"
        description={error.message}
        onRetry={() =>
          void (failed ? failed.refetch() : productsResult.refetch())
        }
      />
    );
  }

  if (orders.length < ids.length || !products) {
    return (
      <div aria-busy="true">
        <span className="sr-only">Loading your order</span>
        <Skeleton className="mx-auto h-72 max-w-[640px] rounded-card" />
      </div>
    );
  }

  const total = orders.reduce((sum, order) => {
    const product = products.find((entry) => entry.id === order.product_id);

    return sum + (product ? product.price * order.quantity : 0);
  }, 0);
  const count = orders.reduce((sum, order) => sum + order.quantity, 0);
  const isSingle = orders.length === 1;

  return (
    <section className="mx-auto max-w-[640px] rounded-card border border-border bg-surface">
      <div className="flex flex-col items-center gap-2.5 px-6 pt-9 pb-7 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-success-soft text-success">
          <Check aria-hidden="true" className="size-5" />
        </span>
        <h1 className="m-0 text-[22px] font-[650]">Order Placed</h1>
        <p className="m-0 max-w-[440px] text-muted-foreground">
          Thanks for shopping with us. {isSingle ? 'Order' : 'Orders'}{' '}
          <b className="font-mono">
            {orders.map((order) => `#${order.id}`).join(', ')}
          </b>{' '}
          {isSingle ? 'is' : 'are'} in. We&apos;re processing{' '}
          {isSingle ? 'it' : 'them'} now, and the status changes to Completed in
          a moment.
        </p>
      </div>
      <div className="flex flex-col gap-4 border-t border-border p-[18px]">
        <div>
          {orders.map((order) => (
            <SummaryItem
              key={order.id}
              productId={order.product_id}
              quantity={order.quantity}
              product={products.find((entry) => entry.id === order.product_id)}
              badge={<OrderStatusBadge status={order.status} />}
            />
          ))}
        </div>
        <SummaryTotal
          count={`(${itemCountLabel(count)})`}
          amount={formatMoney(total)}
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-[18px] py-3">
        <Link
          href="/"
          className={buttonClasses({ variant: 'ghost', className: '-ml-3' })}
        >
          Keep shopping
        </Link>
        <Link href="/orders" className={buttonClasses({})}>
          View my orders
        </Link>
      </div>
    </section>
  );
}
