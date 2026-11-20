import { sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';

import { OrderQueue } from '@/core/queue/order-queue';
import { DatabaseService } from '@/core/database/database.service';
import { DEPENDENCY_CHECK_TIMEOUT_MS } from '@/core/health/health.constants';

export type DependencyStatus = 'ok' | 'error';

export interface Readiness {
  status: 'ok' | 'unavailable';
  database: DependencyStatus;
  queue: DependencyStatus;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly queue: OrderQueue,
    private readonly database: DatabaseService
  ) {}

  async readiness(): Promise<Readiness> {
    const [database, queue] = await Promise.all([
      this.probe(async () => await this.database.db.execute(sql`select 1`)),
      this.probe(async () => await this.queue.ping())
    ]);

    return {
      status: database === 'ok' && queue === 'ok' ? 'ok' : 'unavailable',
      database,
      queue
    };
  }

  private async probe(
    runCheck: () => Promise<unknown>
  ): Promise<DependencyStatus> {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('dependency check timed out')),
        DEPENDENCY_CHECK_TIMEOUT_MS
      );
    });

    try {
      await Promise.race([runCheck(), timeout]);

      return 'ok';
    } catch {
      return 'error';
    } finally {
      clearTimeout(timer);
    }
  }
}
