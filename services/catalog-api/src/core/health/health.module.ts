import { Module } from '@nestjs/common';

import { HealthService } from '@/core/health/health.service';
import { HealthController } from '@/core/health/health.controller';

@Module({
  controllers: [HealthController],
  providers: [HealthService]
})
export class HealthModule {}
