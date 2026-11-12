import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { Injectable, OnModuleDestroy } from '@nestjs/common';

import * as schema from '@shoplite/database';

import { EnvService } from '@/core/config/env.service';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly db: Database;
  private readonly sql: ReturnType<typeof postgres>;

  constructor(private readonly env: EnvService) {
    this.sql = postgres(this.env.postgresUrl, {
      max: this.env.postgresPoolMax
    });
    this.db = drizzle(this.sql, { schema });
  }

  async onModuleDestroy(): Promise<void> {
    await this.sql.end();
  }
}
