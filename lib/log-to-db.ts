import { logStream } from '@superexpert-ai/framework/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
logStream.on('data', async (row: any) => {
  const {
    time,
    userId,
    agentId,
    component,
    level,
    msg,
    ...rest
  } = row;

  await prisma.logEvents.create({
    data: {
      userId,
      agentId,
      component,
      level,
      msg,
      createdAt: time ? new Date(time) : undefined,
      data: rest as Prisma.JsonObject,
    },
  }).catch(() => {});
});