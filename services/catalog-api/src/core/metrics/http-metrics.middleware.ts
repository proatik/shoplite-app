import { trace } from '@opentelemetry/api';
import { Injectable } from '@nestjs/common';

import { OPERATIONAL_PATHS } from '@/service.constants';
import { MetricsService } from '@/core/metrics/metrics.service';

import type { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

const UNMATCHED_ROUTE = 'unmatched';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const started = process.hrtime.bigint();
    const span = trace.getActiveSpan();

    response.once('finish', () => {
      const route = routeOf(request);

      span?.setAttribute('http.route', route);
      span?.updateName(`${request.method} ${route}`);

      if (OPERATIONAL_PATHS.has(route)) {
        return;
      }

      const seconds = Number(process.hrtime.bigint() - started) / 1e9;
      const traceId = span?.spanContext().traceId;

      this.metrics.httpRequests.inc({
        method: request.method,
        route,
        status: String(response.statusCode)
      });
      this.metrics.httpDuration.observe({
        labels: { method: request.method, route },
        value: seconds,
        exemplarLabels: traceId ? { trace_id: traceId } : undefined
      });
    });

    next();
  }
}

// labelling by route template keeps ids in a path out of the series.
function routeOf(request: Request): string {
  const matched: unknown = request.route;

  if (
    typeof matched === 'object' &&
    matched !== null &&
    'path' in matched &&
    typeof matched.path === 'string'
  ) {
    return `${request.baseUrl}${matched.path}`;
  }

  return UNMATCHED_ROUTE;
}
