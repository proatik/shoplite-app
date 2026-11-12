import { Get, Res, Controller } from '@nestjs/common';

import { MetricsService } from '@/core/metrics/metrics.service';

import type { Response } from 'express';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  async scrape(
    @Res({ passthrough: true }) response: Response
  ): Promise<string> {
    response.setHeader('Content-Type', this.metrics.registry.contentType);

    return await this.metrics.registry.metrics();
  }
}
