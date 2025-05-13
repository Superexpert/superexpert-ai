import { Prisma } from '@prisma/client';
import { DBService } from '@/lib/db/db-service';

export interface LogMeta {
  userId?: string;
  agentId?: string;
  component?: string;
  [k: string]: unknown;
}

export class Logger {
  /* create once per request or per service */
  constructor(private bindings: LogMeta = {}) {}

  /** hierarchical bindings (`logger.child({ component:'tool' })`) */
  child(extra: LogMeta) {
    return new Logger({ ...this.bindings, ...extra });
  }

  async info(msg: string, meta: LogMeta = {}) {
    await this.write('info', msg, meta);
  }

  async warn(msg: string, meta: LogMeta = {}) {
    await this.write('warn', msg, meta);
  }

  async error(err: Error, msg = '') {
    await this.write('error', msg || err.message, {
      err: { message: err.message },
    });
  }

  /* internal sink ---------------------------------------------------- */
  private async write(level: string, msg: string, meta: LogMeta) {
    const line = {
      time:       Date.now(),
      level,
      msg,
      ...this.bindings,
      ...meta,
    };

    /* 1️⃣  console / Vercel */
    // keep synchronous so dev tail is instant
    console.log(JSON.stringify(line));

    /* 2️⃣  Postgres — awaited so caller can rely on durability */
    const db = new DBService();
    db.createLogEvent({
        userId   : line.userId,
        agentId  : line.agentId,
        component: line.component,
        level,
        msg,
        createdAt: new Date(line.time),
        data     : line as unknown as Prisma.JsonObject,
      });

  }
}