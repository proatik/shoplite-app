import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert } from 'lucide-react';

import { Link } from '@/components/Link';
import { Notice } from '@/components/Notice';
import { Skeleton } from '@/components/Skeleton';
import { StateBox } from '@/components/StateBox';
import { progressIndex } from '@/lib/order-status';
import { buttonClasses } from '@/components/Button';
import { orderQuery, productQuery } from '@/lib/queries';
import { ProductMedia } from '@/components/ProductMedia';
import { OrderProgress } from '@/components/OrderProgress';
import { formatMoney, formatDateTime } from '@/lib/format';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

import type { Order } from '@/lib/types';

const CARD_CLASSES = 'rounded-card border border-border bg-surface';

function OrderItem({ order }: { order: Order }) {
  const { data: product } = useQuery(productQuery(order.product_id));

  return (
    <section className={CARD_CLASSES}>
      <h2 className="m-0 border-b border-border px-[18px] py-3.5 text-[15px] leading-[22px] font-semibold">
        Items
      </h2>
      <div className="p-[18px]">
        <div className="flex items-center justify-between gap-4">
          <span className="flex min-w-0 items-center gap-3">
            {product ? (
              <ProductMedia
                id={product.id}
                name={product.name}
                imageUrl={product.image_url}
                className="size-10 rounded-md [&_svg]:size-4"
              />
            ) : (
              <Skeleton className="size-10 rounded-md" />
            )}
            <span className="flex min-w-0 flex-col items-start gap-0.5">
              {product ? (
                <Link
                  href={`/products/${product.id}`}
                  title={product.name}
                  className="max-w-full truncate font-semibold text-foreground no-underline hover:underline hover:underline-offset-3"
                >
                  {product.name}
                </Link>
              ) : (
                <Skeleton className="h-4 w-40" />
              )}
              <span className="text-[12.5px] text-muted-foreground tabular-nums">
                {product
                  ? `${order.quantity} x ${formatMoney(product.price)}`
                  : `Quantity ${order.quantity}`}
              </span>
            </span>
          </span>
          {product ? (
            <span className="font-semibold whitespace-nowrap tabular-nums">
              {formatMoney(product.price * order.quantity)}
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3.5">
          <div className="text-base leading-6 font-semibold">Total</div>
          <div className="text-[22px] leading-[30px] font-semibold whitespace-nowrap tabular-nums">
            {product ? formatMoney(product.price * order.quantity) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Loading your order</span>
      <Skeleton className="h-52 rounded-card" />
      <Skeleton className="h-40 rounded-card" />
    </div>
  );
}

export function OrderPage({ id }: { id: number }) {
  const { data: order, error, refetch } = useQuery(orderQuery(id));

  return (
    <>
      <Link
        href="/orders"
        className="mb-5 inline-flex items-center gap-1 text-[13px] font-medium text-primary no-underline hover:underline hover:underline-offset-3"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        My orders
      </Link>
      {error ? (
        <StateBox
          kind="load-failed"
          title="Couldn't load this order"
          description={error.message}
          onRetry={() => void refetch()}
          action={
            <Link
              href="/orders"
              className={buttonClasses({ variant: 'secondary' })}
            >
              Back to my orders
            </Link>
          }
        />
      ) : null}
      {!error && !order ? <OrderSkeleton /> : null}
      {!error && order ? <OrderDetail order={order} /> : null}
    </>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const step = progressIndex(order.status);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-card border border-border bg-surface px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="m-0 text-[22px] leading-[30px] font-[650] tracking-[-0.01em]">
            Order <span className="font-mono text-xl">#{order.id}</span>
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        {step === null ? (
          <Notice
            tone="danger"
            icon={<CircleAlert aria-hidden="true" />}
            title="Order failed"
            className="mt-5"
          >
            We couldn&apos;t process this order. Place it again from the
            catalogue.
          </Notice>
        ) : (
          <div className="mt-6">
            <OrderProgress currentIndex={step} />
          </div>
        )}
        <div className="mt-5 border-t border-border pt-3.5 text-[13.5px] text-muted-foreground">
          <p className="m-0">
            <span className="whitespace-nowrap">
              Placed:{' '}
              <span className="font-medium text-foreground">
                {formatDateTime(order.created_at)}
              </span>
            </span>
            {order.completed_at ? (
              <>
                <span aria-hidden="true" className="mx-2">
                  &middot;
                </span>
                <span className="whitespace-nowrap">
                  Completed:{' '}
                  <span className="font-medium text-foreground">
                    {formatDateTime(order.completed_at)}
                  </span>
                </span>
              </>
            ) : null}
          </p>
        </div>
      </section>
      <OrderItem order={order} />
    </div>
  );
}
