import { it, vi, expect, describe, beforeEach } from 'vitest';

import { MetricsService } from '@/core/metrics/metrics.service';

import type { RedisService } from '@/core/redis/redis.service';

const logger = vi.hoisted(() => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

vi.mock('@shoplite/shared', async (original) => ({
  ...(await original<typeof import('@shoplite/shared')>()),
  createLogger: () => logger
}));

function metricsWith(status: string, depth: number): MetricsService {
  const client = { status, llen: vi.fn().mockResolvedValue(depth) };

  return new MetricsService({ client } as unknown as RedisService);
}

describe('MetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports the queue depth while redis is ready', async () => {
    const output = await metricsWith('ready', 7).registry.metrics();

    expect(output).toMatch(/^order_queue_depth\{[^}]*\} 7$/m);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('still answers the scrape while redis is down', async () => {
    const output = await metricsWith('reconnecting', 7).registry.metrics();

    expect(output).toContain('orders_created_total');
    expect(output).not.toMatch(/^order_queue_depth\{[^}]*\} 7$/m);
    expect(logger.warn).toHaveBeenCalledWith(
      'queue depth not read: redis is not ready',
      { redis_status: 'reconnecting' }
    );
  });
});
