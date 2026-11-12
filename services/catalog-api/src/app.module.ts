import { Module } from '@nestjs/common';

import { RedisModule } from '@/core/redis/redis.module';
import { HealthModule } from '@/core/health/health.module';
import { AppConfigModule } from '@/core/config/config.module';
import { DatabaseModule } from '@/core/database/database.module';

@Module({
  imports: [RedisModule, HealthModule, DatabaseModule, AppConfigModule]
})
export class AppModule {}
