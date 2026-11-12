export function CountPill({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-grid h-5 min-w-[22px] place-items-center rounded-full bg-primary px-[7px] text-xs leading-none font-semibold text-primary-foreground tabular-nums"
    >
      {count}
    </span>
  );
}
