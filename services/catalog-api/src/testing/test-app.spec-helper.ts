import { Test } from '@nestjs/testing';

import { configureApp } from '@/core/http/configure-app';

import type { Type, Provider } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

export async function createTestApp(
  controller: Type,
  providers: Provider[]
): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [controller],
    providers
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false
  });

  configureApp(app);
  await app.init();

  return app;
}
