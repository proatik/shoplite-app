import { useState, useEffect } from 'react';
import { LayoutGrid, ShoppingBag, ClipboardList } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Link } from '@/components/Link';

const SCROLLED_OFFSET_PX = 4;

const NAV_LINK_CLASSES =
  'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm leading-5 font-medium text-muted-foreground no-underline transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary aria-[current=page]:hover:bg-primary-tint motion-reduce:transition-none [&_svg]:size-4';

function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SCROLLED_OFFSET_PX);

    update();
    window.addEventListener('scroll', update, { passive: true });

    return () => window.removeEventListener('scroll', update);
  }, []);

  return scrolled;
}

export function Header({ route }: { route: string }) {
  const scrolled = useScrolled();
  const onCatalogue = route === '/' || route.startsWith('/products/');
  const onOrders = route.startsWith('/orders');

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-surface transition-shadow motion-reduce:transition-none',
        scrolled && 'shadow-raised'
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-[1160px] items-center gap-4 px-5">
        <Link
          href="/"
          className="inline-flex items-center gap-[9px] rounded-md text-lg font-bold tracking-[-0.01em] whitespace-nowrap text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag aria-hidden="true" className="size-4" />
          </span>
          ShopLite
        </Link>
        <nav aria-label="Shop" className="ml-auto flex items-center gap-1">
          <Link
            href="/"
            aria-current={onCatalogue ? 'page' : undefined}
            className={NAV_LINK_CLASSES}
          >
            <LayoutGrid aria-hidden="true" />
            Catalogue
          </Link>
          <Link
            href="/orders"
            aria-current={onOrders ? 'page' : undefined}
            className={NAV_LINK_CLASSES}
          >
            <ClipboardList aria-hidden="true" />
            My orders
          </Link>
        </nav>
      </div>
    </header>
  );
}
