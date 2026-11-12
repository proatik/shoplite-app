import { Badge } from '@/components/Badge';
import { ORDER_STATUS_TONES, ORDER_STATUS_LABELS } from '@/lib/order-status';

import type { OrderStatus } from '@/lib/types';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={ORDER_STATUS_TONES[status]}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
