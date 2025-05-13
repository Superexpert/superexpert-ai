// lib/log-to-db.ts
import { logStream } from '@superexpert-ai/framework/server';  // export from logger.ts
import { Prisma }    from '@prisma/client';
import { DBService } from '@/lib/db/db-service';

/** one DB helper per process */
const db = new DBService();

/* ------------------------------------------------------------------ */
/* Listener: every log row written by getServerLogger() arrives here  */
/* ------------------------------------------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
logStream.on('data', async (row: any) => {
  /* 1️⃣  skip anything that isn’t a normal log row -------------------- */
  if (typeof row !== 'object' || row === null) return;   // e.g. flush() dummy
  if (!row.msg) return;                                  // rows with no message

  /* 2️⃣  destructure; fall back to safe defaults ---------------------- */
  const {
    time,
    userId,
    agentId,
    component,
    level = 'info',
    msg   = '(no message)',
    ...rest
  } = row;

  try {
    /* 3️⃣  persist ---------------------------------------------------- */
    await db.createLogEvent({
      userId,
      agentId,
      component,
      level,
      msg,
      createdAt: time ? new Date(time as number) : undefined,
      data: rest as Prisma.JsonObject,
    });
  } catch /* istanbul ignore next */ {
    /* never let log problems break the user flow */
    console.warn('log-to-db: insert skipped', (row?.msg ?? 'unknown row'));
  }
});