import { Get, Res, HttpStatus, Controller } from '@nestjs/common';

import { HealthService } from '@/core/health/health.service';

import type { Response } from 'express';
import type { Readiness } from '@/core/health/health.service';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('healthz')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('readyz')
  async ready(
    @Res({ passthrough: true }) response: Response
  ): Promise<Readiness> {
    const readiness = await this.health.readiness();

    response.status(
      readiness.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE
    );

    return readiness;
  }
}
