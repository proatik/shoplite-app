import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { TracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  trace,
  context,
  SpanKind,
  propagation,
  SpanStatusCode
} from '@opentelemetry/api';

import { createLogger } from './logger';

import type { Span, Context, SpanOptions } from '@opentelemetry/api';
import type { Instrumentation } from '@opentelemetry/instrumentation';

const TRACER_NAME = 'shoplite';

const logger = createLogger('Telemetry');

export function startTracing(
  serviceName: string,
  instrumentations: Instrumentation[]
): void {
  if (process.env.OTEL_SDK_DISABLED === 'true') {
    return;
  }

  // the full Node SDK would add unused features and megabytes per image.
  const provider = new TracerProvider({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
    spanProcessors: [
      new BatchSpanProcessor({ exporter: new OTLPTraceExporter() })
    ]
  });

  context.setGlobalContextManager(
    new AsyncLocalStorageContextManager().enable()
  );
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  trace.setGlobalTracerProvider(provider);
  registerInstrumentations({ instrumentations, tracerProvider: provider });

  process.once('SIGTERM', () => {
    provider.shutdown().catch((error: unknown) => {
      logger.error('tracing shutdown failed', error);
    });
  });
}

export async function traced<T>(
  name: string,
  options: SpanOptions,
  run: (span: Span) => T | Promise<T>,
  parent: Context = context.active()
): Promise<T> {
  return await trace
    .getTracer(TRACER_NAME)
    .startActiveSpan(name, options, parent, async (span) => {
      try {
        return await run(span);
      } catch (error) {
        if (error instanceof Error) {
          span.recordException(error);
        }

        span.setStatus({ code: SpanStatusCode.ERROR });

        throw error;
      } finally {
        span.end();
      }
    });
}

export async function dbSpan<T>(
  operation: string,
  table: string,
  run: () => Promise<T>
): Promise<T> {
  return await traced(
    `${operation} ${table}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system.name': 'postgresql',
        'db.operation.name': operation,
        'db.collection.name': table
      }
    },
    run
  );
}
