import { it, vi, expect, describe, afterEach } from 'vitest';
import { InternalServerErrorException } from '@nestjs/common';

import { ChaosService } from '@/core/chaos/chaos.service';

import type { EnvService } from '@/core/config/env.service';

function chaosWith(latencyMs: number, errorRate: number): ChaosService {
  return new ChaosService({
    chaosLatencyMs: latencyMs,
    chaosErrorRate: errorRate
  } as EnvService);
}

describe('ChaosService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('never fails or delays with the flags at their defaults', async () => {
    const chaos = chaosWith(0, 0);

    expect(() => chaos.maybeFail()).not.toThrow();
    await expect(chaos.maybeDelay()).resolves.toBeUndefined();
  });

  it('fails every order at CHAOS_ERROR_RATE=1', () => {
    expect(() => chaosWith(0, 1).maybeFail()).toThrow(
      InternalServerErrorException
    );
  });

  it('delays only the requests that fall in the 30% share', async () => {
    vi.useFakeTimers();
    const chaos = chaosWith(500, 0);

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    await expect(chaos.maybeDelay()).resolves.toBeUndefined();

    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    let delayed = true;
    const pending = chaos.maybeDelay().then(() => {
      delayed = false;
    });

    await vi.advanceTimersByTimeAsync(499);
    expect(delayed).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(delayed).toBe(false);
  });
});
