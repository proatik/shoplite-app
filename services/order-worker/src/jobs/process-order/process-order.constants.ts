// an order takes 1-2 s, so four consumers outpace the load test's 2 orders/s.
export const CONSUMERS_PER_POD = 4;

export const POP_TIMEOUT_SECONDS = 1;

export const RETRY_DELAY_MS = 1000;

export const MIN_PROCESSING_MS = 1000;

export const PROCESSING_SPREAD_MS = 1000;

export const LEAKED_BYTES_PER_ORDER = 256 * 1024;
