import { it, vi, expect, describe, beforeEach } from 'vitest';

import { MetricsService } from '@/core/metrics/metrics.service';

import type { OrderQueue } from '@/core/queue/order-queue';

const logger = vi.hoisted(() => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

vi.mock('@shoplite/shared', async (original) => ({
  ...(await original<typeof import('@shoplite/shared')>()),
  createLogger: () => logger
}));

function metricsWith(depth: () => Promise<number>): MetricsService {
  const queue = { name: 'orders:pending', depth };

  return new MetricsService(queue as unknown as OrderQueue);
}

describe('MetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports the queue depth while the queue is reachable', async () => {
    const output = await metricsWith(async () => 7).registry.metrics();

    expect(output).toMatch(/^order_queue_depth\{[^}]*\} 7$/m);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('still answers the scrape while the queue is down', async () => {
    const depth = vi.fn().mockRejectedValue(new Error('redis is not ready'));
    const output = await metricsWith(depth).registry.metrics();

    expect(output).toContain('orders_created_total');
    expect(output).not.toMatch(/^order_queue_depth\{[^}]*\} 7$/m);
    expect(logger.warn).toHaveBeenCalledWith('queue depth not read', {
      reason: 'redis is not ready'
    });
  });
});
