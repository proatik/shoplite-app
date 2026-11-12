import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';
import { ORDER_PROGRESS, ORDER_STATUS_LABELS } from '@/lib/order-status';

const STEP_CLASSES =
  'relative flex flex-1 flex-col items-center gap-2 text-center before:absolute before:top-[11px] before:right-1/2 before:-left-1/2 before:h-0.5 first:before:hidden';

const DOT_CLASSES =
  'relative z-[1] grid size-6 place-items-center rounded-full border-2';

export function OrderProgress({ currentIndex }: { currentIndex: number }) {
  return (
    <ol aria-label="Order progress" className="m-0 flex list-none p-0">
      {ORDER_PROGRESS.map((status, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isReached = isDone || isCurrent;

        return (
          <li
            key={status}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              STEP_CLASSES,
              isReached ? 'before:bg-primary' : 'before:bg-border'
            )}
          >
            <span
              className={cn(
                DOT_CLASSES,
                !isReached && 'border-control-border bg-surface',
                isDone && 'border-primary bg-primary text-primary-foreground',
                isCurrent &&
                  'border-primary bg-primary shadow-[inset_0_0_0_4px_var(--color-surface)]'
              )}
            >
              {isDone ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : null}
            </span>
            <span
              className={cn(
                'text-[13px] leading-[18px] text-muted-foreground',
                isDone && 'text-foreground',
                isCurrent && 'font-semibold text-foreground'
              )}
            >
              {ORDER_STATUS_LABELS[status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
