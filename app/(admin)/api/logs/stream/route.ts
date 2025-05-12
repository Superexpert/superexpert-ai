
export const runtime = 'nodejs';
export const maxDuration = 300;       // 5-minute window on Vercel

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
        const rows = await db.getLogStream(
          lastId,
          agent.id,
          100,                  // max rows per poll
        );

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



