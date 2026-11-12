import { it, expect, describe } from 'vitest';

import { JsonLogger } from './logger';
import {
  TEST_SPAN,
  inTestSpan,
  useTestPropagation
} from './telemetry.spec-helper';

function capture(): { lines: Record<string, unknown>[]; logger: JsonLogger } {
  const lines: Record<string, unknown>[] = [];
  const logger = new JsonLogger('catalog-api', (line) =>
    lines.push(JSON.parse(line) as Record<string, unknown>)
  );

  return { lines, logger };
}

describe('JsonLogger', () => {
  useTestPropagation();

  it('writes the brief fields on every line', () => {
    const { lines, logger } = capture();

    logger.log('order created', { order_id: 42 }, 'OrdersService');

    expect(lines[0]).toMatchObject({
      level: 'info',
      service: 'catalog-api',
      message: 'order created',
      trace_id: null,
      order_id: 42,
      context: 'OrdersService'
    });
    expect(Date.parse(String(lines[0]?.timestamp))).not.toBeNaN();
  });

  it('adds the trace id inside a trace', () => {
    const { lines, logger } = capture();

    inTestSpan(() => logger.warn('slow request'));

    expect(lines[0]).toMatchObject({
      level: 'warn',
      trace_id: TEST_SPAN.traceId
    });
  });

  it('maps every nest level onto the brief levels', () => {
    const { lines, logger } = capture();

    logger.error('failed');
    logger.fatal('stopped');
    logger.debug('detail');
    logger.verbose('more detail');

    expect(lines.map((line) => line.level)).toEqual([
      'error',
      'fatal',
      'debug',
      'debug'
    ]);
  });
});
