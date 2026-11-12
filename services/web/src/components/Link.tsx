import { navigate } from '@/lib/navigation';

import type { MouseEvent, ComponentProps } from 'react';

type LinkProps = ComponentProps<'a'> & { href: string };

// modified clicks keep the browser default, e.g. ctrl+click opens a new tab.
function isPlainClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

export function Link({ href, onClick, ...props }: LinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented && isPlainClick(event)) {
          event.preventDefault();
          navigate(href);
        }
      }}
    />
  );
}
