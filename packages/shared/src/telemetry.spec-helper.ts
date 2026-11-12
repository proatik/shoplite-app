import { afterAll, beforeAll } from 'vitest';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { trace, context, propagation } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';

export const TEST_SPAN = {
  traceId: '0af7651916cd43dd8448eb211c80319c',
  spanId: 'b7ad6b7169203331',
  traceFlags: 1
};

export const TEST_TRACEPARENT = `00-${TEST_SPAN.traceId}-${TEST_SPAN.spanId}-01`;

export function useTestPropagation(): void {
  beforeAll(() => {
    context.setGlobalContextManager(
      new AsyncLocalStorageContextManager().enable()
    );
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  });

  afterAll(() => {
    context.disable();
    propagation.disable();
  });
}

export function inTestSpan<T>(run: () => T): T {
  return context.with(
    trace.setSpan(context.active(), trace.wrapSpanContext(TEST_SPAN)),
    run
  );
}
