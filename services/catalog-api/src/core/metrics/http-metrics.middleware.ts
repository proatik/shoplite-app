import { Injectable } from '@nestjs/common';
import { trace, context } from '@opentelemetry/api';

import { createLogger } from '@shoplite/shared';

import { OPERATIONAL_PATHS } from '@/service.constants';
import { MetricsService } from '@/core/metrics/metrics.service';

import type { NestMiddleware } from '@nestjs/common';
import type { Span } from '@opentelemetry/api';
import type { Request, Response, NextFunction } from 'express';

const UNMATCHED_ROUTE = 'unmatched';
const FIRST_SERVER_ERROR = 500;

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  private readonly logger = createLogger(HttpMetricsMiddleware.name);

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
      const status = response.statusCode;

      this.metrics.httpRequests.inc({
        method: request.method,
        route,
        status: String(status)
      });
      this.metrics.httpDuration.observe({
        labels: { method: request.method, route },
        value: seconds,
        exemplarLabels: traceId ? { trace_id: traceId } : undefined
      });

      if (status >= FIRST_SERVER_ERROR) {
        this.logServerError(span, {
          method: request.method,
          route,
          status,
          duration_ms: Math.round(seconds * 1000)
        });
      }
    });

    next();
  }

  // every 5xx gets a log line, so a trace or an exemplar always leads to a log.
  private logServerError(
    span: Span | undefined,
    fields: Record<string, string | number>
  ): void {
    const log = (): void => {
      this.logger.error('request failed', undefined, fields);
    };

    // finish fires outside the request context; the span supplies trace_id.
    if (span) {
      context.with(trace.setSpan(context.active(), span), log);
    } else {
      log();
    }
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
