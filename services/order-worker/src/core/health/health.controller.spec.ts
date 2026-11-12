import request from 'supertest';
import { it, vi, expect, describe, afterAll, beforeAll } from 'vitest';

import { HealthService } from '@/core/health/health.service';
import { createTestApp } from '@/testing/test-app.spec-helper';
import { HealthController } from '@/core/health/health.controller';

import type { INestApplication } from '@nestjs/common';

const health = { readiness: vi.fn() };

describe('HealthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp(HealthController, [
      { provide: HealthService, useValue: health }
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /healthz answers 200 while the process runs', async () => {
    await request(app.getHttpServer()).get('/healthz').expect(200);
  });

  it('GET /readyz answers 200 when the database and queue are reachable', async () => {
    health.readiness.mockResolvedValue({
      status: 'ok',
      database: 'ok',
      queue: 'ok'
    });

    await request(app.getHttpServer()).get('/readyz').expect(200);
  });

  it('GET /readyz answers 503 when the queue is unreachable', async () => {
    health.readiness.mockResolvedValue({
      status: 'unavailable',
      database: 'ok',
      queue: 'error'
    });

    const response = await request(app.getHttpServer())
      .get('/readyz')
      .expect(503);

    expect(response.body.queue).toBe('error');
  });
});
