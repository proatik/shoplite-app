import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

import { startTracing } from '@shoplite/shared';

import { SERVICE_NAME, OPERATIONAL_PATHS } from '@/service.constants';

// runs via --require, so tracing patches http before the app loads it.
startTracing(SERVICE_NAME, [
  new HttpInstrumentation({
    ignoreIncomingRequestHook: (request) =>
      OPERATIONAL_PATHS.has((request.url ?? '').split('?')[0])
  })
]);
