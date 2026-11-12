import { it, vi, expect, describe, beforeEach } from 'vitest';

import { ProcessOrderProcessor } from '@/jobs/process-order/process-order.processor';

import type { RedisService } from '@/core/redis/redis.service';
import type { MetricsService } from '@/core/metrics/metrics.service';
import type { ProcessOrderService } from '@/jobs/process-order/process-order.service';

const processor = { process: vi.fn() };
const metrics = { recordOrder: vi.fn() };

function consumerWith(messages: (string | null)[]): {
  consumer: ProcessOrderProcessor;
  quit: ReturnType<typeof vi.fn>;
} {
  const quit = vi.fn().mockResolvedValue('OK');
  let consumer: ProcessOrderProcessor;
  const connection = {
    brpop: vi.fn(() => {
      const next = messages.shift();

      if (messages.length === 0) {
        void consumer.beforeApplicationShutdown();
      }

      return Promise.resolve(next ? ['orders:pending', next] : null);
    }),
    quit
  };
  const redis = { client: { duplicate: () => connection } };

  consumer = new ProcessOrderProcessor(
    redis as unknown as RedisService,
    metrics as unknown as MetricsService,
    processor as unknown as ProcessOrderService
  );

  return { consumer, quit };
}

describe('ProcessOrderProcessor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('processes a queued order and records its result', async () => {
    processor.process.mockResolvedValue('COMPLETED');
    const { consumer, quit } = consumerWith(['{"order_id":42}', null]);

    consumer.onApplicationBootstrap();
    await consumer.beforeApplicationShutdown();

    expect(processor.process).toHaveBeenCalledWith(42);
    expect(metrics.recordOrder).toHaveBeenCalledWith(
      'completed',
      expect.any(Number),
      expect.any(String)
    );
    expect(quit).toHaveBeenCalled();
  });

  it('records a FAILED order as failed', async () => {
    processor.process.mockResolvedValue('FAILED');
    const { consumer } = consumerWith(['{"order_id":7}', null]);

    consumer.onApplicationBootstrap();
    await consumer.beforeApplicationShutdown();

    expect(metrics.recordOrder).toHaveBeenCalledWith(
      'failed',
      expect.any(Number),
      expect.any(String)
    );
  });

  it('rejects a malformed message without processing it', async () => {
    const { consumer } = consumerWith(['not json', null]);

    consumer.onApplicationBootstrap();
    await consumer.beforeApplicationShutdown();

    expect(processor.process).not.toHaveBeenCalled();
  });

  it('counts an order whose processing throws as an error', async () => {
    processor.process.mockRejectedValue(new Error('database down'));
    const { consumer } = consumerWith(['{"order_id":9}', null]);

    consumer.onApplicationBootstrap();
    await consumer.beforeApplicationShutdown();

    expect(metrics.recordOrder).toHaveBeenCalledWith(
      'error',
      expect.any(Number),
      expect.any(String)
    );
  });
});
