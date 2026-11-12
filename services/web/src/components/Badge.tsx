import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

const TONE_CLASSES = {
  warning: 'bg-badge-warning-bg text-badge-warning',
  primary: 'bg-badge-primary-bg text-badge-primary',
  success: 'bg-badge-success-bg text-badge-success',
  danger: 'bg-badge-danger-bg text-badge-danger'
} as const;

export type BadgeTone = keyof typeof TONE_CLASSES;

export function Badge({
  tone,
  children
}: {
  tone: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 align-top text-[11px] leading-4 font-medium whitespace-nowrap',
        TONE_CLASSES[tone]
      )}
    >
      {children}
    </span>
  );
}
