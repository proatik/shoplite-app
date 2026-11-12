import { ConfigModule } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';

import { validateEnv } from '@/core/config/env.schema';
import { EnvService } from '@/core/config/env.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    })
  ],
  providers: [EnvService],
  exports: [EnvService]
})
export class AppConfigModule {}
