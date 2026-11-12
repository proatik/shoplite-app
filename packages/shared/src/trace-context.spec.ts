import { trace } from '@opentelemetry/api';
import { it, expect, describe } from 'vitest';

import { captureTraceContext, restoreTraceContext } from './trace-context';
import {
  TEST_SPAN,
  inTestSpan,
  TEST_TRACEPARENT,
  useTestPropagation
} from './telemetry.spec-helper';

describe('trace context', () => {
  useTestPropagation();

  it('captures the active trace as a traceparent', () => {
    expect(inTestSpan(captureTraceContext)).toEqual({
      traceparent: TEST_TRACEPARENT
    });
  });

  it('captures nothing outside a trace', () => {
    expect(captureTraceContext()).toBeNull();
  });

  it('restores the trace a job carries', () => {
    const restored = restoreTraceContext({ traceparent: TEST_TRACEPARENT });

    expect(trace.getSpanContext(restored)).toMatchObject({
      traceId: TEST_SPAN.traceId,
      spanId: TEST_SPAN.spanId,
      isRemote: true
    });
  });

  it('starts a new trace when a job carries none', () => {
    expect(
      trace.getSpanContext(restoreTraceContext(undefined))
    ).toBeUndefined();
  });
});
