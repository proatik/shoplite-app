import { EventEmitter } from 'node:events';
import { it, vi, expect, describe, beforeEach } from 'vitest';

import { HttpMetricsMiddleware } from '@/core/metrics/http-metrics.middleware';

import type { Request, Response } from 'express';
import type { MetricsService } from '@/core/metrics/metrics.service';

const logger = vi.hoisted(() => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

vi.mock('@shoplite/shared', async (original) => ({
  ...(await original<typeof import('@shoplite/shared')>()),
  createLogger: () => logger
}));

const metrics = {
  httpRequests: { inc: vi.fn() },
  httpDuration: { observe: vi.fn() }
};

function finish(status: number, path: string): void {
  const middleware = new HttpMetricsMiddleware(
    metrics as unknown as MetricsService
  );
  const request = { method: 'POST', baseUrl: '', route: { path } };
  const response = Object.assign(new EventEmitter(), { statusCode: status });

  middleware.use(
    request as unknown as Request,
    response as unknown as Response,
    vi.fn()
  );
  response.emit('finish');
}

describe('HttpMetricsMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs every 5xx with its method, route and status', () => {
    finish(500, '/orders');

    expect(logger.error).toHaveBeenCalledWith(
      'request failed',
      undefined,
      expect.objectContaining({ method: 'POST', route: '/orders', status: 500 })
    );
    expect(metrics.httpRequests.inc).toHaveBeenCalledWith({
      method: 'POST',
      route: '/orders',
      status: '500'
    });
  });

  it('writes no log line for a successful request', () => {
    finish(201, '/orders');

    expect(logger.error).not.toHaveBeenCalled();
    expect(metrics.httpRequests.inc).toHaveBeenCalled();
  });

  it('leaves the operational endpoints out of logs and metrics', () => {
    finish(503, '/readyz');

    expect(logger.error).not.toHaveBeenCalled();
    expect(metrics.httpRequests.inc).not.toHaveBeenCalled();
  });
});
