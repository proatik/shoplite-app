import { useState } from 'react';
import { Package } from 'lucide-react';

import { cn } from '@/lib/cn';

const TILE_CLASSES = [
  'bg-tile-1 text-tile-1-foreground',
  'bg-tile-2 text-tile-2-foreground',
  'bg-tile-3 text-tile-3-foreground',
  'bg-tile-4 text-tile-4-foreground',
  'bg-tile-5 text-tile-5-foreground',
  'bg-tile-6 text-tile-6-foreground'
] as const;

export function ProductMedia({
  id,
  name,
  imageUrl,
  dim = false,
  className,
  iconClassName
}: {
  id: number;
  name: string;
  imageUrl: string | null;
  dim?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = imageUrl !== null && imageUrl !== failedUrl;

  return (
    <div
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden',
        TILE_CLASSES[id % TILE_CLASSES.length],
        className
      )}
    >
      <Package aria-hidden="true" className={iconClassName} />
      {showImage ? (
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          onError={() => setFailedUrl(imageUrl)}
          className={cn(
            'absolute inset-0 size-full object-cover',
            dim && 'grayscale'
          )}
        />
      ) : null}
    </div>
  );
}
