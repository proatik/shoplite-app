import { cn } from '@/lib/cn';

import type { ReactNode } from 'react';

const TONE_CLASSES = {
  warning: {
    box: 'border-warning-border bg-warning-soft',
    icon: 'text-warning',
    title: ''
  },
  danger: {
    box: 'border-danger-border bg-danger-soft',
    icon: 'text-danger',
    title: 'text-danger'
  }
} as const;

export function Notice({
  tone,
  icon,
  title,
  role,
  className,
  children
}: {
  tone: keyof typeof TONE_CLASSES;
  icon: ReactNode;
  title: string;
  role?: 'alert' | 'status';
  className?: string;
  children: ReactNode;
}) {
  const classes = TONE_CLASSES[tone];

  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-[13.5px] leading-5 text-foreground',
        classes.box,
        className
      )}
    >
      <span className={cn('mt-0.5 flex shrink-0 [&_svg]:size-4', classes.icon)}>
        {icon}
      </span>
      <div>
        <div className={cn('font-semibold', classes.title)}>{title}</div>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
