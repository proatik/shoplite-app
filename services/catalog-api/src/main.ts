import { NestFactory } from '@nestjs/core';

import { JsonLogger, createLogger } from '@shoplite/shared';

import { AppModule } from '@/app.module';
import { SERVICE_NAME } from '@/service.constants';
import { EnvService } from '@/core/config/env.service';
import { configureApp } from '@/core/http/configure-app';

import type { NestExpressApplication } from '@nestjs/platform-express';

const logger = createLogger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true
  });

  app.useLogger(new JsonLogger(SERVICE_NAME));
  app.enableShutdownHooks();

  configureApp(app);

  await app.listen(app.get(EnvService).port);
}

bootstrap().catch((error: unknown) => {
  logger.error('catalog-api failed to start', error);
  process.exit(1);
});
