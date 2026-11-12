import { cn } from '@/lib/cn';

import type { ButtonHTMLAttributes } from 'react';

const BASE_CLASSES =
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent font-medium leading-none whitespace-nowrap no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT_CLASSES = {
  primary:
    'bg-primary text-primary-foreground enabled:hover:bg-primary-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
  secondary:
    'border-control-border bg-surface text-foreground enabled:hover:bg-surface-muted',
  ghost:
    'bg-transparent text-muted-foreground enabled:hover:bg-surface-muted enabled:hover:text-foreground'
} as const;

const SIZE_CLASSES = {
  default: 'h-8 px-3 text-sm',
  lg: 'h-10 px-[18px] text-[15px]'
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASSES;

type ButtonSize = keyof typeof SIZE_CLASSES;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
};

export function buttonClasses({
  variant = 'primary',
  size = 'default',
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  return cn(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className
  );
}

export function Button({
  variant,
  size,
  busy = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({
        variant,
        size,
        className: cn(busy && 'cursor-progress', className)
      })}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy ? (
        <>
          <span className="invisible inline-flex items-center gap-1.5">
            {children}
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 m-auto inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
          />
        </>
      ) : (
        children
      )}
    </button>
  );
}
