import { ChevronRight } from 'lucide-react';

import { Link } from '@/components/Link';

import type { ReactNode } from 'react';

export function Crumbs({ children }: { children: ReactNode }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1.5 text-[13px] text-muted-foreground"
    >
      <Link
        href="/"
        className="text-muted-foreground no-underline hover:text-primary"
      >
        Catalogue
      </Link>
      <ChevronRight aria-hidden="true" className="size-4" />
      <span className="truncate">{children}</span>
    </nav>
  );
}
