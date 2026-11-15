import { it, vi, expect, describe, beforeEach } from 'vitest';

import { CONSUMERS_PER_POD } from '@/jobs/process-order/process-order.constants';
import { ProcessOrderProcessor } from '@/jobs/process-order/process-order.processor';

import type { RedisService } from '@/core/redis/redis.service';
import type { MetricsService } from '@/core/metrics/metrics.service';
import type { ProcessOrderService } from '@/jobs/process-order/process-order.service';

const processor = { process: vi.fn() };
const metrics = { recordOrder: vi.fn() };

// consumers pop from one shared queue; each gets its own connection, as in redis.
function consumerWith(messages: (string | null)[]): {
  consumer: ProcessOrderProcessor;
  quits: ReturnType<typeof vi.fn>[];
} {
  const quits: ReturnType<typeof vi.fn>[] = [];
  const duplicate = (): object => {
    const quit = vi.fn().mockResolvedValue('OK');
    quits.push(quit);

    return {
      brpop: vi.fn(() => {
        const next = messages.shift();

        return Promise.resolve(next ? ['orders:pending', next] : null);
      }),
      quit
    };
  };
  const redis = { client: { duplicate } };

  const consumer = new ProcessOrderProcessor(
    redis as unknown as RedisService,
    metrics as unknown as MetricsService,
    processor as unknown as ProcessOrderService
  );

  return { consumer, quits };
}

describe('ProcessOrderProcessor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('processes a queued order and records its result', async () => {
    processor.process.mockResolvedValue('COMPLETED');
    const { consumer } = consumerWith(['{"order_id":42}', null]);

    consumer.onApplicationBootstrap();
    await consumer.beforeApplicationShutdown();

    expect(processor.process).toHaveBeenCalledWith(42);
    expect(metrics.recordOrder).toHaveBeenCalledWith(
      'completed',
      expect.any(Number),
      expect.any(String)
    );
  });

  it('runs one consumer per connection and closes each on shutdown', async () => {
    processor.process.mockResolvedValue('COMPLETED');
    const orders = ['{"order_id":1}', '{"order_id":2}', '{"order_id":3}'];
    const { consumer, quits } = consumerWith(orders);

    consumer.onApplicationBootstrap();
    await consumer.beforeApplicationShutdown();

    expect(processor.process).toHaveBeenCalledTimes(3);
    expect(quits).toHaveLength(CONSUMERS_PER_POD);
    quits.forEach((quit) => expect(quit).toHaveBeenCalledOnce());
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
