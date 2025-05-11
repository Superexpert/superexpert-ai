export const runtime = 'nodejs';

import '@/lib/log-events-bus'; // side-effect: registers bus
import { logBus } from '@/lib/log-events-bus';
import { auth } from '@/auth';
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

    return new Response(
        new ReadableStream({
            start(controller) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const send = (row: any) => {
                    // Filter by agentId
                    if (row.agentId !== agent.id) return;
                    controller.enqueue(`data:${JSON.stringify(row)}\n\n`);
                };
                logBus.on('row', send);

                const hb = setInterval(() => {
                    controller.enqueue(':\n\n');          // SSE comment = heartbeat
                }, 15_000);


                req.signal.addEventListener('abort', () => {
                    clearInterval(hb);
                    logBus.off('row', send);
                    controller.close();
                });
            },
        }),
        {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        }
    );
}

