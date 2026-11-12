import helmet from 'helmet';
import { Reflector } from '@nestjs/core';
import {
  StandardSchemaValidationPipe,
  StandardSchemaSerializerInterceptor
} from '@nestjs/common';

import type { NestExpressApplication } from '@nestjs/platform-express';

export function configureApp(app: NestExpressApplication): void {
  app.use(helmet());
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.useGlobalInterceptors(
    new StandardSchemaSerializerInterceptor(app.get(Reflector))
  );
}
