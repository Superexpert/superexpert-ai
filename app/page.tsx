
import AgentList from '@/app/ui/agent-list';
import { Suspense } from 'react';
import { getAgentListAction } from '@/lib/server/admin-actions';
import { redirect } from 'next/navigation';

export default async function AgentListPage() {
    const agents = await getAgentListAction();

    // If the uer does not have any agents, redirect to the agents page
    if (agents.length === 0) {
        redirect('/admin/agents');
    }
    return (
        <main className="flex items-center justify-center md:h-screen">
        <div className="relative mx-auto flex w-full flex-col space-y-2.5 p-4 md:-mt-32">
            <Suspense fallback={<div className="h-72 w-full animate-pulse bg-gray-100" />}>
                <AgentList agents={agents} />
            </Suspense>
        </div>
        </main>
    );
}
