import { cn } from '@/lib/cn';
export function SkeletonText({
  children,
  className
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded bg-skeleton box-decoration-clone text-transparent motion-reduce:animate-none',
        className
      )}
    >
      {children}
    </span>
  );
}
