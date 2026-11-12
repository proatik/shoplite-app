import { cn } from '@/lib/cn';
import { formatAmount, CURRENCY_CODE } from '@/lib/format';

export function Price({
  amount,
  className,
  currencyClassName
}: {
  amount: number;
  className?: string;
  currencyClassName?: string;
}) {
  return (
    <p
      className={cn(
        'm-0 text-[17px] leading-6 font-semibold whitespace-nowrap text-foreground tabular-nums',
        className
      )}
    >
      <span
        className={cn(
          'text-[0.76em] font-semibold tracking-[0.03em] text-muted-foreground',
          currencyClassName
        )}
      >
        {CURRENCY_CODE}
      </span>{' '}
      {formatAmount(amount)}
    </p>
  );
}
