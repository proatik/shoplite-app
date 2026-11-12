import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

export function SummaryTotal({
  count,
  amount,
  className
}: {
  count: ReactNode;
  amount: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 border-t border-border pt-3.5',
        className
      )}
    >
      <div className="text-base leading-6 font-semibold">
        Total{' '}
        <span className="text-[13px] font-normal text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="text-[22px] leading-[30px] font-semibold whitespace-nowrap tabular-nums">
        {amount}
      </div>
    </div>
  );
}
