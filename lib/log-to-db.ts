// import { logStream } from '@superexpert-ai/framework/server';
// import { Prisma }    from '@prisma/client';
// import { DBService } from '@/lib/db/db-service';

// type LS = typeof logStream & { __pending?: number };
// const ls = logStream as LS;
// ls.__pending ??= 0;                          // initialise counter once

// const db = new DBService();

// // one listener per process
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// ls.on('data', async (row: any) => {
//   if (typeof row !== 'object' || row === null) return;   // skip dummy
//   if (!row.msg) return;                                  // skip blanks

//   ls.__pending!++;                                       // ++ before insert
//   try {
//     await db.createLogEvent({
//       userId   : row.userId,
//       agentId  : row.agentId,
//       component: row.component,
//       level    : row.level ?? 'info',
//       msg      : row.msg,
//       createdAt: row.time ? new Date(row.time as number) : undefined,
//       data     : row as Prisma.JsonObject,
//     });
//   } catch {
//     /* swallow DB errors to avoid breaking user flow */
//   } finally {
//     if (--ls.__pending! === 0) {
//       // notify any waiters that all inserts are done
//       ls.emit('db-drain');
//     }
//   }
// });