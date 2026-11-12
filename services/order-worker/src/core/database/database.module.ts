import { Global, Module } from '@nestjs/common';

import { DatabaseService } from '@/core/database/database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class DatabaseModule {}
