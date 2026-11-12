import { Test } from '@nestjs/testing';

import type { Type, Provider, INestApplication } from '@nestjs/common';

export async function createTestApp(
  controller: Type,
  providers: Provider[]
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [controller],
    providers
  }).compile();

  const app = moduleRef.createNestApplication({ logger: false });

  await app.init();

  return app;
}
