import { useQuery } from '@tanstack/react-query';

import { cn } from '@/lib/cn';
import { Link } from '@/components/Link';
import { Price } from '@/components/Price';
import { productsQuery } from '@/lib/queries';
import { Skeleton } from '@/components/Skeleton';
import { StateBox } from '@/components/StateBox';
import { StockText } from '@/components/StockText';
import { useSearchParams } from '@/hooks/useRoute';
import { PageHeading } from '@/components/PageHeading';
import { ProductMedia } from '@/components/ProductMedia';
import { Pagination, PaginationSkeleton } from '@/components/Pagination';
import { showPage, pageCountOf, parsePageParams } from '@/lib/pagination';

import type { Product } from '@/lib/types';

const GRID_CLASSES =
  'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5';

const CARD_CLASSES =
  'flex flex-col overflow-hidden rounded-card border border-border bg-surface text-foreground no-underline';

const CARD_BODY_CLASSES = 'flex flex-1 flex-col gap-2.5 px-4 pt-3.5 pb-4';

function ProductCard({ product }: { product: Product }) {
  const inStock = product.stock > 0;

  return (
    <Link
      href={`/products/${product.id}`}
      title={product.name}
      className={cn(
        CARD_CLASSES,
        'transition-colors hover:border-control-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none'
      )}
    >
      <ProductMedia
        id={product.id}
        name={product.name}
        imageUrl={product.image_url}
        dim={!inStock}
        className="aspect-[4/3]"
        iconClassName={cn('size-8 stroke-[1.5]', !inStock && 'opacity-45')}
      />
      <div className={CARD_BODY_CLASSES}>
        <h2 className="m-0 line-clamp-2 h-10 text-[14.5px] leading-5 font-semibold wrap-anywhere">
          {product.name}
        </h2>
        <div className="mt-auto flex h-6 items-center justify-between gap-2">
          <Price
            amount={product.price}
            className={cn(!inStock && 'text-muted-foreground')}
          />
          <StockText inStock={inStock} />
        </div>
      </div>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className={CARD_CLASSES}>
      <Skeleton className="aspect-[4/3] h-auto rounded-none" />
      <div className={CARD_BODY_CLASSES}>
        <div className="flex h-10 flex-col justify-around">
          <Skeleton className="h-[13px] w-[90%]" />
          <Skeleton className="h-[13px] w-[55%]" />
        </div>
        <div className="mt-auto flex h-6 items-center justify-between gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}

function Catalogue() {
  const { page: requestedPage, pageSize } = parsePageParams(useSearchParams());
  const { data: products, isError, refetch } = useQuery(productsQuery());

  if (isError) {
    return (
      <StateBox
        kind="load-failed"
        title="Couldn't load the catalogue"
        description="Check your connection and try again."
        onRetry={() => void refetch()}
      />
    );
  }

  if (!products) {
    return (
      <div aria-busy="true">
        <span className="sr-only">Loading the catalogue</span>
        <div className={GRID_CLASSES}>
          {Array.from({ length: pageSize }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
        <div className="mt-6">
          <PaginationSkeleton />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <StateBox
        kind="empty"
        title="Nothing for sale yet"
        description="New products show up here as soon as they're added. Check back soon."
      />
    );
  }

  const page = Math.min(requestedPage, pageCountOf(products.length, pageSize));
  const visible = products.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className={GRID_CLASSES}>
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="mt-6">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={products.length}
          itemLabel="products"
          onPageChange={(next) => showPage('/', { page: next, pageSize })}
          onPageSizeChange={(next) =>
            showPage('/', { page: 1, pageSize: next })
          }
        />
      </div>
    </>
  );
}

export function CataloguePage() {
  return (
    <>
      <PageHeading
        title="Catalogue"
        description="Everything on sale at ShopLite."
      />
      <Catalogue />
    </>
  );
}
