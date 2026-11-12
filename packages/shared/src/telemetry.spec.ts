import { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { it, expect, describe, afterAll, beforeAll, beforeEach } from 'vitest';
import {
  TracerProvider,
  SimpleSpanProcessor,
  InMemorySpanExporter
} from '@opentelemetry/sdk-trace';

import { dbSpan, traced } from './telemetry';
import { useTestPropagation } from './telemetry.spec-helper';

const exporter = new InMemorySpanExporter();

describe('telemetry', () => {
  useTestPropagation();

  beforeAll(() => {
    trace.setGlobalTracerProvider(
      new TracerProvider({
        spanProcessors: [new SimpleSpanProcessor({ exporter })]
      })
    );
  });

  beforeEach(() => {
    exporter.reset();
  });

  afterAll(() => {
    trace.disable();
  });

  it('nests a span started inside another one', async () => {
    await traced('order.process', {}, () =>
      traced('order.update', {}, () => 'COMPLETED')
    );

    const [child, parent] = exporter.getFinishedSpans();

    expect([child.name, parent.name]).toEqual([
      'order.update',
      'order.process'
    ]);
    expect(child.parentSpanContext?.spanId).toBe(parent.spanContext().spanId);
  });

  it('returns the result and ends the span', async () => {
    await expect(traced('order.update', {}, () => 'COMPLETED')).resolves.toBe(
      'COMPLETED'
    );

    expect(exporter.getFinishedSpans()[0].status.code).toBe(
      SpanStatusCode.UNSET
    );
  });

  it('marks the span as failed and rethrows the error', async () => {
    await expect(
      traced('order.update', {}, () => {
        throw new Error('database down');
      })
    ).rejects.toThrow('database down');

    const [span] = exporter.getFinishedSpans();

    expect(span.status.code).toBe(SpanStatusCode.ERROR);
    expect(span.events[0].name).toBe('exception');
  });

  it('records a database call as a client span', async () => {
    await dbSpan('UPDATE', 'orders', async () => await Promise.resolve(1));

    const [span] = exporter.getFinishedSpans();

    expect(span.name).toBe('UPDATE orders');
    expect(span.kind).toBe(SpanKind.CLIENT);
    expect(span.attributes).toMatchObject({
      'db.system.name': 'postgresql',
      'db.collection.name': 'orders'
    });
  });
});
