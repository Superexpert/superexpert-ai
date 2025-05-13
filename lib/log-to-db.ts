import { logStream } from '@superexpert-ai/framework/server';
import { Prisma } from '@prisma/client';
import { DBService } from '@/lib/db/db-service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
logStream.on('data', async (row: any) => {
  if (row.__skipDb) return;            // ← skip dummy row from flush()

  const { time, userId, agentId, component, level, msg, ...rest } = row;
  const db = new DBService();
  await db.createLogEvent({
    userId,
    agentId,
    component,
    level,
    msg,
    createdAt: time ? new Date(time) : undefined,
    data: rest as Prisma.JsonObject,
  });
});

