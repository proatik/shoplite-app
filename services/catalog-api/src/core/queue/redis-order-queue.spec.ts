import { it, vi, expect, describe } from 'vitest';

import { RedisOrderQueue } from '@/core/queue/redis-order-queue';

import type { RedisService } from '@/core/redis/redis.service';

function queueWith(status: string): {
  queue: RedisOrderQueue;
  client: { status: string; llen: ReturnType<typeof vi.fn> };
} {
  const client = { status, llen: vi.fn().mockResolvedValue(3) };

  return {
    queue: new RedisOrderQueue({ client } as unknown as RedisService),
    client
  };
}

describe('RedisOrderQueue', () => {
  it('reads the list length while redis is ready', async () => {
    const { queue, client } = queueWith('ready');

    expect(await queue.depth()).toBe(3);
    expect(client.llen).toHaveBeenCalledWith('orders:pending');
  });

  it('refuses to read the depth while redis is not ready', async () => {
    const { queue, client } = queueWith('reconnecting');

    await expect(queue.depth()).rejects.toThrow('redis is not ready');
    expect(client.llen).not.toHaveBeenCalled();
  });
});
