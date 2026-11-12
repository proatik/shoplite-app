import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Select } from '@/components/Select';
import { Skeleton } from '@/components/Skeleton';
import { pageItems, pageCountOf, PAGE_SIZE_OPTIONS } from '@/lib/pagination';

const FOOTER_CLASSES =
  'grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs text-muted-foreground';

const PAGE_BUTTON_CLASSES =
  'inline-grid h-7 min-w-7 cursor-pointer place-items-center rounded-md border border-control-border bg-surface px-1.5 text-xs text-foreground tabular-nums enabled:hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40';

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function Pagination({
  page,
  pageSize,
  total,
  itemLabel,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const pageCount = pageCountOf(total, pageSize);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className={FOOTER_CLASSES}>
      <span
        aria-label={`Showing ${first} to ${last} of ${total} ${itemLabel}`}
        className="inline-flex h-7 w-[120px] items-center justify-center justify-self-start rounded-md border border-border bg-surface text-xs text-foreground tabular-nums"
      >
        {first}
        <span className="mx-1 text-muted-foreground">&ndash;</span>
        {last}
        <span className="mx-1 text-muted-foreground">/</span>
        {total}
      </span>
      <nav aria-label="Pages" className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={PAGE_BUTTON_CLASSES}
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
        </button>
        {pageItems(page, pageCount).map((item, index) =>
          item === 'gap' ? (
            <span
              key={`gap-${index}`}
              aria-hidden="true"
              className="inline-flex h-7 items-end px-0.5 pb-1.5"
            >
              {'…'}
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                PAGE_BUTTON_CLASSES,
                item === page &&
                  'border-primary bg-primary font-semibold text-primary-foreground enabled:hover:bg-primary'
              )}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className={PAGE_BUTTON_CLASSES}
        >
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </nav>
      <span className="justify-self-end">
        <Select
          aria-label="Rows per page"
          className="w-[120px] min-w-0 text-xs"
          options={PAGE_SIZE_OPTIONS.map((size) => ({
            value: String(size),
            label: `${size} per page`
          }))}
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        />
      </span>
    </div>
  );
}

export function PaginationSkeleton() {
  return (
    <div className={FOOTER_CLASSES} aria-hidden="true">
      <Skeleton className="h-7 w-[120px] justify-self-start rounded-md" />
      <span className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="size-7 rounded-md" />
        ))}
      </span>
      <Skeleton className="h-7 w-[120px] justify-self-end rounded-md" />
    </div>
  );
}
