import { ArrowLeft, CircleAlert } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/cn';
import { Link } from '@/components/Link';
import { useCart } from '@/hooks/useCart';
import { formatMoney } from '@/lib/format';
import { navigate } from '@/lib/navigation';
import { useToast } from '@/hooks/useToast';
import { Notice } from '@/components/Notice';
import { productsQuery } from '@/lib/queries';
import { placeLines } from '@/lib/place-lines';
import { Skeleton } from '@/components/Skeleton';
import { StateBox } from '@/components/StateBox';
import { useMyOrders } from '@/hooks/useMyOrders';
import { PageHeading } from '@/components/PageHeading';
import { SummaryTotal } from '@/components/SummaryTotal';
import { SkeletonText } from '@/components/SkeletonText';
import { Button, buttonClasses } from '@/components/Button';
import { CartLineRow, CART_LINE_CLASSES } from '@/components/CartLineRow';
import {
  cartCount,
  cartTotal,
  resolveLines,
  cartAttention,
  itemCountLabel
} from '@/lib/cart';

import type { CartLine } from '@/lib/cart';

const LAYOUT_CLASSES = 'grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6';

const CARD_CLASSES = 'rounded-card border border-border bg-surface';

const CARD_TITLE_CLASSES =
  'm-0 border-b border-border px-[18px] py-3.5 text-[15px] leading-[22px] font-semibold';

const SKELETON_LINES = 3;

function KeepShopping() {
  return (
    <Link
      href="/"
      className={buttonClasses({
        variant: 'ghost',
        className: '-ml-3 self-start'
      })}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Keep shopping
    </Link>
  );
}

function CartSkeleton() {
  return (
    <div aria-busy="true" className={LAYOUT_CLASSES}>
      <span className="sr-only">Loading your cart</span>
      <div className="flex flex-col gap-4">
        <section aria-hidden="true" className={CARD_CLASSES}>
          <h2 className={CARD_TITLE_CLASSES}>Items</h2>
          {Array.from({ length: SKELETON_LINES }, (_, index) => (
            <div key={index} className={CART_LINE_CLASSES}>
              <Skeleton className="size-14 h-auto rounded-md" />
              <div className="flex min-w-0 flex-col items-start">
                <SkeletonText className="font-semibold">
                  Sundarban Raw Honey, 500 g
                </SkeletonText>
                <div className="text-[12.5px]">
                  <SkeletonText>BDT 650.00 each</SkeletonText>
                </div>
              </div>
              <Skeleton className="h-8 w-[102px] rounded-md" />
              <div className="flex justify-end font-semibold">
                <SkeletonText>BDT 1,950.00</SkeletonText>
              </div>
              <Skeleton className="size-7 rounded-md" />
            </div>
          ))}
        </section>
        <KeepShopping />
      </div>
      <aside aria-hidden="true" className={cn(CARD_CLASSES, 'sticky top-20')}>
        <h2 className={CARD_TITLE_CLASSES}>Order Summary</h2>
        <div className="flex flex-col gap-4 p-[18px]">
          <SummaryTotal
            className="border-t-0 pt-0"
            count={<SkeletonText>(6 items)</SkeletonText>}
            amount={<SkeletonText>BDT 9,100.00</SkeletonText>}
          />
          <Skeleton className="h-10 rounded-md" />
        </div>
      </aside>
    </div>
  );
}

function Cart() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { record } = useMyOrders();
  const { items, setQuantity, remove } = useCart();
  const {
    data: products,
    isError,
    refetch
  } = useQuery({
    ...productsQuery(),
    enabled: items.length > 0
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (lines: readonly CartLine[]) => {
      const result = await placeLines(lines, record);

      remove(result.placedProductIds);

      return result;
    },
    onSuccess: ({ placedIds, failures }) => {
      failures.forEach(({ name, message }) => toast(`${name}: ${message}`));

      if (failures.length === 0) {
        navigate(`/placed?ids=${placedIds.join(',')}`);
      }
    },
    onSettled: () => queryClient.invalidateQueries(productsQuery())
  });

  if (items.length === 0) {
    return (
      <StateBox
        kind="empty"
        title="Your cart is empty"
        description="Add products from the catalogue and they show up here."
        action={
          <Link href="/" className={buttonClasses({})}>
            Browse the catalogue
          </Link>
        }
      />
    );
  }

  if (isError) {
    return (
      <StateBox
        kind="load-failed"
        title="Couldn't load your cart"
        description="Check your connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  if (!products) {
    return <CartSkeleton />;
  }

  const lines = resolveLines(items, products);
  const attention = cartAttention(lines);
  const count = cartCount(items);

  return (
    <div className={LAYOUT_CLASSES}>
      <div className="flex flex-col gap-4">
        {attention ? (
          <Notice
            tone="danger"
            role="alert"
            icon={<CircleAlert aria-hidden="true" />}
            title={attention.title}
          >
            {attention.text}
          </Notice>
        ) : null}
        <section className={cn(CARD_CLASSES, 'overflow-hidden')}>
          <h2 className={CARD_TITLE_CLASSES}>Items</h2>
          <div>
            {lines.map((line) => (
              <CartLineRow
                key={line.productId}
                line={line}
                onQuantityChange={(quantity) =>
                  setQuantity(line.productId, quantity)
                }
                onRemove={() => remove([line.productId])}
              />
            ))}
          </div>
        </section>
        <KeepShopping />
      </div>
      <aside className={cn(CARD_CLASSES, 'sticky top-20')}>
        <h2 className={CARD_TITLE_CLASSES}>Order Summary</h2>
        <div className="flex flex-col gap-4 p-[18px]">
          <SummaryTotal
            className="border-t-0 pt-0"
            count={`(${itemCountLabel(count)})`}
            amount={formatMoney(cartTotal(lines))}
          />
          <Button
            size="lg"
            busy={isPending}
            disabled={attention !== null}
            onClick={() => mutate(lines)}
            className="w-full"
          >
            Place order
          </Button>
          <p className="m-0 text-xs leading-4 text-muted-foreground">
            {attention
              ? 'Fix the flagged line to continue.'
              : 'Prices are checked again when you place the order.'}
          </p>
        </div>
      </aside>
    </div>
  );
}

export function CartPage() {
  return (
    <>
      <PageHeading
        title="Your Cart"
        description="The products you're about to order and what they cost."
      />
      <Cart />
    </>
  );
}
