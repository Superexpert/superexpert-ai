
export const runtime = 'nodejs';
export const maxDuration = 300;       // 5-minute window on Vercel

import { prisma } from '@/lib/db/prisma';
import { auth }   from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { DBAdminService } from '@/lib/db/db-admin-service';
import { User } from '@superexpert-ai/framework';


export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error('User not authenticated');
    }
    const user = session.user as User;
    if (!user) return NextResponse.json([], { status: 401 });

    const { searchParams } = new URL(req.url);
    const agentName = searchParams.get('agentName');
    if (!agentName) {
        return NextResponse.json([], { status: 400 });
    }

    // Need to get agentId from agentName + userId (this is for authorization)
    const db = new DBAdminService(user.id);
    const agent = await db.getAgentByName(agentName);
    if (!agent) {
        return NextResponse.json([], { status: 404 });
    }



  let lastId = BigInt(0);          // remember progress per connection

  const stream = new ReadableStream({
    async start(controller) {
      // poll loop
      const tick = async () => {
        const rows = await prisma.logEvents.findMany({
          where: {
            id:    { gt: lastId },
            agentId: agent.id,
          },
          orderBy: { id: 'asc' },
        });

for (const r of rows) {
  lastId = r.id;

  // guard: turn non-objects into an empty object
  const extras =
    r.data && typeof r.data === 'object' && !Array.isArray(r.data)
      ? (r.data as Record<string, unknown>)
      : {};

  controller.enqueue(
    `data:${JSON.stringify({
      time:      r.createdAt.getTime(),
      level:     r.level,
      msg:       r.msg,
      userId:    r.userId,
      agentId:   r.agentId,
      component: r.component,
      ...extras,              // safe spread
    })}\n\n`,
  );
}
        // heartbeat (keeps idle < 25 s)
        controller.enqueue(':\n\n');
        timer = setTimeout(tick, 1000);   // 1-s server-side poll
      };

      let timer = setTimeout(tick, 0);

      req.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection:      'keep-alive',
    },
  });
}



// export const runtime = 'nodejs';
// export const maxDuration = 300; 

// import '@/lib/log-events-bus'; // side-effect: registers bus
// import { logBus } from '@/lib/log-events-bus';
// import { auth } from '@/auth';
// import { NextRequest, NextResponse } from 'next/server';
// import { DBAdminService } from '@/lib/db/db-admin-service';
// import { User } from '@superexpert-ai/framework';

// export async function GET(req: NextRequest) {
//     const session = await auth();
//     if (!session || !session.user) {
//         throw new Error('User not authenticated');
//     }
//     const user = session.user as User;
//     if (!user) return NextResponse.json([], { status: 401 });

//     const { searchParams } = new URL(req.url);
//     const agentName = searchParams.get('agentName');
//     if (!agentName) {
//         return NextResponse.json([], { status: 400 });
//     }

//     // Need to get agentId from agentName + userId (this is for authorization)
//     const db = new DBAdminService(user.id);
//     const agent = await db.getAgentByName(agentName);
//     if (!agent) {
//         return NextResponse.json([], { status: 404 });
//     }

//     return new Response(
//         new ReadableStream({
//             start(controller) {
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 const send = (row: any) => {
//                     // Filter by agentId
//                     if (row.agentId !== agent.id) return;
//                     controller.enqueue(`data:${JSON.stringify(row)}\n\n`);
//                 };
//                 logBus.on('row', send);

//                 const hb = setInterval(() => {
//                     controller.enqueue(':\n\n');          // SSE comment = heartbeat
//                 }, 15_000);


//                 req.signal.addEventListener('abort', () => {
//                     clearInterval(hb);
//                     logBus.off('row', send);
//                     controller.close();
//                 });
//             },
//         }),
//         {
//             headers: {
//                 'Content-Type': 'text/event-stream',
//                 'Cache-Control': 'no-cache',
//                 Connection: 'keep-alive',
//             },
//         }
//     );
// }

