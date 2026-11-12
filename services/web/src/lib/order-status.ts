import type { OrderStatus } from '@/lib/types';
import type { BadgeTone } from '@/components/Badge';

export const ORDER_PROGRESS = [
  'PENDING',
  'PROCESSING',
  'COMPLETED'
] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABELS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
} as const satisfies Record<OrderStatus, string>;

export const ORDER_STATUS_TONES = {
  PENDING: 'warning',
  PROCESSING: 'primary',
  COMPLETED: 'success',
  FAILED: 'danger'
} as const satisfies Record<OrderStatus, BadgeTone>;

export function progressIndex(status: OrderStatus): number | null {
  if (status === 'COMPLETED') {
    return ORDER_PROGRESS.length;
  }

  const index = ORDER_PROGRESS.findIndex((step) => step === status);

  return index === -1 ? null : index;
}
