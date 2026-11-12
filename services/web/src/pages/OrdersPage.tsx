import { useQuery } from '@tanstack/react-query';

import { cn } from '@/lib/cn';
import { Link } from '@/components/Link';
import { navigate } from '@/lib/navigation';
import { Skeleton } from '@/components/Skeleton';
import { StateBox } from '@/components/StateBox';
import { useMyOrders } from '@/hooks/useMyOrders';
import { useSearchParams } from '@/hooks/useRoute';
import { buttonClasses } from '@/components/Button';
import { Pagination } from '@/components/Pagination';
import { PageHeading } from '@/components/PageHeading';
import { orderQuery, productsQuery } from '@/lib/queries';
import { formatMoney, formatDateTime } from '@/lib/format';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { showPage, pageCountOf, parsePageParams } from '@/lib/pagination';

import type { Product } from '@/lib/types';
import type { StoredOrder } from '@/lib/my-orders';

const COLUMNS = [
  { key: 'order', label: 'Order', width: 120, isRight: false },
  { key: 'product', label: 'Product', width: undefined, isRight: false },
  { key: 'quantity', label: 'Quantity', width: 110, isRight: true },
  { key: 'placed', label: 'Placed', width: 220, isRight: false },
  { key: 'status', label: 'Status', width: 140, isRight: false },
  { key: 'total', label: 'Total', width: 160, isRight: true }
] as const;

const CELL_CLASSES = 'truncate border-t border-border px-4 py-3 align-middle';

const ORDER_REF_CLASSES =
  'font-mono text-[13px] font-semibold text-foreground no-underline';

function alignClasses(isRight: boolean) {
  return isRight ? 'text-right tabular-nums' : 'text-left';
}

function OrderRow({
  stored,
  products
}: {
  stored: StoredOrder;
  products: readonly Product[] | undefined;
}) {
  const { data: order, error } = useQuery(orderQuery(stored.id));
  const product = products?.find((entry) => entry.id === order?.product_id);
  const href = `/orders/${stored.id}`;
  const link = (
    <Link href={href} className={ORDER_REF_CLASSES}>
      #{stored.id}
    </Link>
  );

  if (error) {
    return (
      <tr onClick={() => navigate(href)}>
        <td className={CELL_CLASSES}>{link}</td>
        <td colSpan={2} className={cn(CELL_CLASSES, 'text-danger')}>
          {error.message}
        </td>
        <td colSpan={3} className={cn(CELL_CLASSES, 'text-muted-foreground')}>
          {formatDateTime(stored.placedAt)}
        </td>
      </tr>
    );
  }

  return (
    <tr
      onClick={() => navigate(href)}
      className="cursor-pointer hover:bg-surface-muted"
    >
      <td className={CELL_CLASSES}>{link}</td>
      <td className={CELL_CLASSES}>
        {order && products ? (
          (product?.name ?? `Product #${order.product_id}`)
        ) : (
          <Skeleton className="w-3/4" />
        )}
      </td>
      <td className={cn(CELL_CLASSES, alignClasses(true))}>
        {order ? order.quantity : <Skeleton className="ml-auto w-8" />}
      </td>
      <td className={CELL_CLASSES}>
        {order ? (
          formatDateTime(order.created_at)
        ) : (
          <Skeleton className="w-2/3" />
        )}
      </td>
      <td className={CELL_CLASSES}>
        {order ? (
          <OrderStatusBadge status={order.status} />
        ) : (
          <Skeleton className="h-5 w-20 rounded-full" />
        )}
      </td>
      <td className={cn(CELL_CLASSES, alignClasses(true))}>
        {order && product ? (
          formatMoney(product.price * order.quantity)
        ) : (
          <Skeleton className="ml-auto w-24" />
        )}
      </td>
    </tr>
  );
}

function Orders() {
  const { orders } = useMyOrders();
  const { page: requestedPage, pageSize } = parsePageParams(useSearchParams());
  const { data: products } = useQuery(productsQuery());

  if (orders.length === 0) {
    return (
      <StateBox
        kind="empty"
        title="No orders yet"
        description="When you place an order in this browser, it shows up here with its status."
        action={
          <Link href="/" className={buttonClasses({})}>
            Browse the catalogue
          </Link>
        }
      />
    );
  }

  const page = Math.min(requestedPage, pageCountOf(orders.length, pageSize));
  const visible = orders.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="overflow-x-auto">
        <table
          aria-label="My orders"
          className="w-full min-w-[820px] table-fixed border-collapse text-sm leading-5"
        >
          <thead>
            <tr className="bg-surface-muted">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-4 py-2.5 text-[11.5px] font-semibold whitespace-nowrap text-muted-foreground',
                    alignClasses(column.isRight)
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((stored) => (
              <OrderRow key={stored.id} stored={stored} products={products} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-2.5">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={orders.length}
          itemLabel="orders"
          onPageChange={(next) => showPage('/orders', { page: next, pageSize })}
          onPageSizeChange={(next) =>
            showPage('/orders', { page: 1, pageSize: next })
          }
        />
      </div>
    </div>
  );
}

export function OrdersPage() {
  return (
    <>
      <PageHeading
        title="My Orders"
        description="Every order you've placed in this browser, newest first."
      />
      <Orders />
    </>
  );
}
