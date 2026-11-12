import { Link } from '@/components/Link';

const FOOTER_LINKS = [
  { href: '/', label: 'Catalogue' },
  { href: '/orders', label: 'My orders' }
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-5 text-[13px] text-muted-foreground">
        <span>
          <span className="font-bold text-foreground">ShopLite</span>
          {' · '}Handmade goods from across Bangladesh
          {' · '}© {new Date().getFullYear()} ShopLite
        </span>
        <nav aria-label="Footer">
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted-foreground no-underline hover:text-foreground hover:underline hover:underline-offset-3"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
