import { NestFactory } from '@nestjs/core';

import { JsonLogger, createLogger } from '@shoplite/shared';

import { WorkerModule } from '@/worker.module';
import { SERVICE_NAME } from '@/service.constants';
import { EnvService } from '@/core/config/env.service';

const logger = createLogger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(WorkerModule, { bufferLogs: true });

  app.useLogger(new JsonLogger(SERVICE_NAME));
  app.enableShutdownHooks();

  await app.listen(app.get(EnvService).port);
}

bootstrap().catch((error: unknown) => {
  logger.error('order-worker failed to start', error);
  process.exit(1);
});
