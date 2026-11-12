import { FileX, Inbox, CircleAlert } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Button } from '@/components/Button';

import type { ReactNode } from 'react';

const KIND_ICONS = {
  empty: Inbox,
  'load-failed': CircleAlert,
  'not-found': FileX
} as const;

export function StateBox({
  kind,
  title,
  description,
  onRetry,
  action
}: {
  kind: keyof typeof KIND_ICONS;
  title: string;
  description: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  const failed = kind === 'load-failed';
  const Icon = KIND_ICONS[kind];

  return (
    <div
      role={failed ? 'alert' : undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-card border bg-surface px-6 py-14 text-center',
        failed ? 'border-danger-border' : 'border-dashed border-border-strong'
      )}
    >
      <span
        className={cn(
          'mb-1 grid size-14 place-items-center rounded-full',
          failed
            ? 'bg-danger-soft text-danger'
            : 'bg-surface-muted text-muted-foreground'
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h2
        className={cn(
          'm-0 text-base leading-6 font-semibold',
          failed && 'text-danger'
        )}
      >
        {title}
      </h2>
      <p className="m-0 max-w-[380px] text-[13.5px] text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button variant="secondary" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
