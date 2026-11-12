import { useMemo, useSyncExternalStore } from 'react';

import { NAVIGATE_EVENT } from '@/lib/navigation';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);

  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

// returns the current path without its query, e.g. "/" or "/orders/42".
export function useRoute(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, () => window.location.search);

  return useMemo(() => new URLSearchParams(search), [search]);
}
