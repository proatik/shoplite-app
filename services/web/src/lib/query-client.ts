import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api';

const MAX_RETRIES = 3;

// a 4xx answer will not change on a second try.
function shouldRetry(failureCount: number, error: Error) {
  const isClientError = error instanceof ApiError && error.status < 500;

  return !isClientError && failureCount < MAX_RETRIES;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: shouldRetry } }
  });
}
