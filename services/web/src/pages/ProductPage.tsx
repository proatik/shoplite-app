import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, ShoppingCart } from 'lucide-react';

import { cn } from '@/lib/cn';
import { ApiError } from '@/lib/api';
import { Link } from '@/components/Link';
import { useCart } from '@/hooks/useCart';
import { MAX_QUANTITY } from '@/lib/cart';
import { Price } from '@/components/Price';
import { Notice } from '@/components/Notice';
import { Crumbs } from '@/components/Crumbs';
import { productQuery } from '@/lib/queries';
import { Skeleton } from '@/components/Skeleton';
import { StateBox } from '@/components/StateBox';
import { StockText } from '@/components/StockText';
import { ProductMedia } from '@/components/ProductMedia';
import { Button, buttonClasses } from '@/components/Button';
import { QuantityStepper } from '@/components/QuantityStepper';

import type { Product } from '@/lib/types';

const LONG_DESCRIPTION_LENGTH = 240;

const SUMMARY_CLASSES =
  'm-0 max-w-[65ch] text-[14.5px] leading-[1.7] text-muted-foreground';

const DETAILS_CLASSES = 'mt-12 scroll-mt-24 border-t border-border pt-8';

const LAYOUT_CLASSES = 'grid grid-cols-2 items-stretch gap-12';

const DETAILS_ID = 'about-full';

const HERO_CLASSES =
  'aspect-[4/3] max-h-[440px] w-full self-start rounded-[14px]';

const INFO_CLASSES = 'flex max-w-[520px] flex-col gap-5';

const TITLE_CLASSES =
  'm-0 text-[26px] leading-[34px] font-[650] tracking-[-0.01em]';

function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const inStock = product.stock > 0;
  const max = Math.min(product.stock, MAX_QUANTITY);

  return (
    <div className="flex gap-3">
      <QuantityStepper
        value={inStock ? quantity : 1}
        max={max}
        size="lg"
        onChange={setQuantity}
      />
      <Button
        disabled={!inStock}
        onClick={() => add(product.id, quantity, max)}
        className="h-11 flex-1 text-[15px] [&_svg]:size-4"
      >
        <ShoppingCart aria-hidden="true" />
        Add to cart
      </Button>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading product</span>
      <div aria-hidden="true" className={cn(LAYOUT_CLASSES, 'mt-8')}>
        <Skeleton className={cn(HERO_CLASSES, 'h-auto')} />
        <div className={INFO_CLASSES}>
          <Skeleton className="h-[26px] w-3/4" />
          <div className="mt-auto flex flex-col gap-5">
            <Skeleton className="h-9 w-48" />
            <div className="flex gap-3">
              <Skeleton className="h-11 w-[146px] shrink-0 rounded-md" />
              <Skeleton className="h-11 flex-1 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductPage({ id }: { id: number }) {
  const { data: product, error, refetch } = useQuery(productQuery(id));

  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    const title = missing ? 'Product not found' : 'Product unavailable';

    return (
      <>
        <Crumbs>{title}</Crumbs>
        <StateBox
          kind={missing ? 'not-found' : 'load-failed'}
          title={title}
          description={error.message}
          onRetry={() => void refetch()}
          action={
            <Link href="/" className={buttonClasses({ variant: 'secondary' })}>
              Back to the catalogue
            </Link>
          }
        />
      </>
    );
  }

  if (!product) {
    return <ProductSkeleton />;
  }

  const inStock = product.stock > 0;
  const isLong = product.description.length > LONG_DESCRIPTION_LENGTH;

  return (
    <div>
      <Crumbs>{product.name}</Crumbs>
      <div className={LAYOUT_CLASSES}>
        <ProductMedia
          id={product.id}
          name={product.name}
          imageUrl={product.image_url}
          dim={!inStock}
          className={HERO_CLASSES}
          iconClassName={cn(
            'size-[72px] stroke-[1.2]',
            !inStock && 'opacity-30'
          )}
        />
        <div className={INFO_CLASSES}>
          <h1 className={TITLE_CLASSES}>{product.name}</h1>
          {product.description ? (
            <div className="flex flex-col items-start gap-1.5">
              <p
                className={cn(
                  SUMMARY_CLASSES,
                  isLong && (inStock ? 'line-clamp-4' : 'line-clamp-3')
                )}
              >
                {product.description}
              </p>
              {isLong ? (
                <a
                  href={`#${DETAILS_ID}`}
                  className="self-start text-sm font-semibold text-primary no-underline hover:underline hover:underline-offset-3"
                >
                  Read more
                </a>
              ) : null}
            </div>
          ) : null}
          <div className="mt-auto flex flex-col gap-5">
            {inStock ? null : (
              <Notice
                tone="warning"
                icon={<Info aria-hidden="true" />}
                title="Out of stock"
              >
                This product can&apos;t be added to your cart right now. Check
                back later.
              </Notice>
            )}
            <div className="flex items-baseline gap-3.5">
              <Price
                amount={product.price}
                className={cn(
                  'text-[28px] leading-9 tracking-[-0.01em]',
                  !inStock && 'text-muted-foreground'
                )}
                currencyClassName="text-[15px]"
              />
              <StockText inStock={inStock} className="text-sm" />
            </div>
            <AddToCart product={product} />
          </div>
        </div>
      </div>
      {isLong ? (
        <section
          id={DETAILS_ID}
          aria-labelledby="about-title"
          className={DETAILS_CLASSES}
        >
          <h2
            id="about-title"
            className="m-0 mb-3 text-lg leading-[26px] font-semibold"
          >
            About this product
          </h2>
          <p className="m-0 max-w-[65ch] text-[15px] leading-[1.7] text-foreground">
            {product.description}
          </p>
        </section>
      ) : null}
    </div>
  );
}
