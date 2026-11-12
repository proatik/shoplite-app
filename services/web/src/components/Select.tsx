import { Check, ChevronDown } from 'lucide-react';
import { Select as BaseSelect } from '@base-ui/react/select';

import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  options,
  value,
  onValueChange,
  className,
  'aria-label': ariaLabel
}: {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  'aria-label': string;
}) {
  return (
    <BaseSelect.Root
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) {
          onValueChange(next);
        }
      }}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          'inline-flex h-7 min-w-[72px] cursor-pointer items-center justify-between gap-2 rounded-md border border-control-border bg-surface pr-2 pl-[11px] text-[12.5px] text-foreground tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
      >
        <BaseSelect.Value className="truncate whitespace-nowrap" />
        <BaseSelect.Icon className="flex shrink-0 text-muted-foreground">
          <ChevronDown className="size-3.5" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          className="z-50"
          sideOffset={4}
          align="end"
          alignItemWithTrigger={false}
        >
          <BaseSelect.Popup className="min-w-(--anchor-width) rounded-md border border-border bg-surface p-1 shadow-raised outline-none">
            <BaseSelect.List className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex h-[30px] shrink-0 cursor-pointer items-center justify-between gap-3 rounded px-2 text-xs whitespace-nowrap text-foreground tabular-nums outline-none select-none data-highlighted:bg-surface-muted data-selected:font-semibold data-selected:text-primary"
                >
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="flex text-primary">
                    <Check className="size-3.5" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
