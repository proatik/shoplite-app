import { setTimeout as sleep } from 'node:timers/promises';

import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { EnvService } from '@/core/config/env.service';

const LATENCY_SHARE = 0.3;

@Injectable()
export class ChaosService {
  constructor(private readonly env: EnvService) {}

  async maybeDelay(): Promise<void> {
    const delayMs = this.env.chaosLatencyMs;

    if (delayMs > 0 && Math.random() < LATENCY_SHARE) {
      await sleep(delayMs);
    }
  }

  // the failure names no cause, so only the telemetry can explain it.
  maybeFail(): void {
    if (Math.random() < this.env.chaosErrorRate) {
      throw new InternalServerErrorException();
    }
  }
}
