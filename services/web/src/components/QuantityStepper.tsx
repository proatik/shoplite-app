import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

import { cn } from '@/lib/cn';

const BUTTON_CLASSES =
  'grid h-full cursor-pointer place-items-center border-0 bg-transparent p-0 text-muted-foreground first:rounded-l-md last:rounded-r-md enabled:hover:bg-surface-muted enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4';

const SIZE_CLASSES = {
  default: { box: 'h-8', button: 'w-8', input: 'w-10 text-sm' },
  lg: { box: 'h-11', button: 'w-11', input: 'w-14 text-[15px]' }
} as const;

export function QuantityStepper({
  value,
  max,
  size = 'default',
  label = 'Quantity',
  className,
  onChange
}: {
  value: number;
  max: number;
  size?: keyof typeof SIZE_CLASSES;
  label?: string;
  className?: string;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const sizeClasses = SIZE_CLASSES[size];

  function commit(next: number) {
    setDraft(null);
    onChange(Math.min(Math.max(next || 1, 1), max));
  }

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center rounded-md border border-control-border bg-surface focus-within:ring-2 focus-within:ring-ring',
        sizeClasses.box,
        className
      )}
    >
      <button
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={value <= 1}
        onClick={() => commit(value - 1)}
        className={cn(BUTTON_CLASSES, sizeClasses.button)}
      >
        <Minus aria-hidden="true" />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        autoComplete="off"
        value={draft ?? String(value)}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ''))}
        onBlur={() => draft !== null && commit(Number(draft))}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && draft !== null) {
            event.preventDefault();
            commit(Number(draft));
          }
        }}
        className={cn(
          'h-full border-x border-y-0 border-border bg-transparent p-0 text-center text-foreground tabular-nums outline-none',
          sizeClasses.input
        )}
      />
      <button
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => commit(value + 1)}
        className={cn(BUTTON_CLASSES, sizeClasses.button)}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}
