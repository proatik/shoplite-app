import {
  Gauge,
  Counter,
  Registry,
  Histogram,
  collectDefaultMetrics,
  openMetricsContentType
} from '@prometheus-io/client';

import type { OpenMetricsContentType } from '@prometheus-io/client';

export { Gauge, Counter, Histogram };

export type MetricsRegistry = Registry<OpenMetricsContentType>;

export function createMetricsRegistry(service: string): MetricsRegistry {
  // only OpenMetrics carries exemplars, which link latency to traces.
  const registry = new Registry(openMetricsContentType);

  registry.setDefaultLabels({ service });
  collectDefaultMetrics({ register: registry });

  return registry;
}
