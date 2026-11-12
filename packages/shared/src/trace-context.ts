import { z } from 'zod';
import { context, propagation, ROOT_CONTEXT } from '@opentelemetry/api';

import type { Context } from '@opentelemetry/api';

export const TraceContextSchema = z.record(z.string(), z.string());

export type TraceContext = z.infer<typeof TraceContextSchema>;

export function captureTraceContext(): TraceContext | null {
  const carrier: TraceContext = {};

  propagation.inject(context.active(), carrier);

  return Object.keys(carrier).length > 0 ? carrier : null;
}

export function restoreTraceContext(
  carrier: TraceContext | undefined
): Context {
  return carrier ? propagation.extract(ROOT_CONTEXT, carrier) : ROOT_CONTEXT;
}
