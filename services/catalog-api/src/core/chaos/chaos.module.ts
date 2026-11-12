import { Global, Module } from '@nestjs/common';

import { ChaosService } from '@/core/chaos/chaos.service';

@Global()
@Module({
  providers: [ChaosService],
  exports: [ChaosService]
})
export class ChaosModule {}
