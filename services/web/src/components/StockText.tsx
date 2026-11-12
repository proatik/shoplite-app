import { cn } from '@/lib/cn';
export function StockText({
  inStock,
  className
}: {
  inStock: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-[12.5px] leading-5 font-semibold whitespace-nowrap',
        inStock ? 'text-success' : 'text-danger',
        className
      )}
    >
      {inStock ? 'In stock' : 'Out of stock'}
    </span>
  );
}
