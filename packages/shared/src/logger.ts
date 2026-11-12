import { Logger } from '@nestjs/common';
import { trace, isSpanContextValid } from '@opentelemetry/api';

import type { LoggerService } from '@nestjs/common';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogFields {
  [key: string]: unknown;
}

export interface AppLogger {
  log(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, error?: unknown, fields?: LogFields): void;
}

export class JsonLogger implements LoggerService {
  constructor(
    private readonly service: string,
    private readonly write: (line: string) => void = (line) =>
      process.stdout.write(`${line}\n`)
  ) {}

  log(message: unknown, ...params: unknown[]): void {
    this.emit('info', message, params);
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.emit('warn', message, params);
  }

  error(message: unknown, ...params: unknown[]): void {
    this.emit('error', message, params);
  }

  fatal(message: unknown, ...params: unknown[]): void {
    this.emit('fatal', message, params);
  }

  debug(message: unknown, ...params: unknown[]): void {
    this.emit('debug', message, params);
  }

  verbose(message: unknown, ...params: unknown[]): void {
    this.emit('debug', message, params);
  }

  private emit(level: LogLevel, message: unknown, params: unknown[]): void {
    this.write(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service: this.service,
        message: String(message),
        trace_id: activeTraceId(),
        ...fieldsOf(params)
      })
    );
  }
}

export function createLogger(context: string): AppLogger {
  const logger = new Logger(context);

  return {
    log(message, fields) {
      logger.log(message, ...defined(fields));
    },
    warn(message, fields) {
      logger.warn(message, ...defined(fields));
    },
    error(message, error, fields) {
      logger.error(message, ...defined(errorFields(error), fields));
    }
  };
}

function activeTraceId(): string | null {
  const span = trace.getActiveSpan()?.spanContext();

  return span && isSpanContextValid(span) ? span.traceId : null;
}

function fieldsOf(params: unknown[]): LogFields {
  const fields: LogFields = {};

  for (const param of params) {
    if (typeof param === 'string') {
      // the context name arrives as the last string argument.
      fields.context = param;
    } else if (typeof param === 'object' && param !== null) {
      Object.assign(fields, param);
    }
  }

  return fields;
}

function errorFields(error: unknown): LogFields | undefined {
  if (error === undefined) {
    return undefined;
  }

  return error instanceof Error
    ? { error: error.message, stack: error.stack }
    : { error: String(error) };
}

function defined(...values: (LogFields | undefined)[]): LogFields[] {
  return values.filter((value) => value !== undefined);
}
