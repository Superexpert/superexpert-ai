import AgentList from '@/app/(admin)/ui/agent-list';
import { Suspense } from 'react';
import { getAgentListAction } from '@/lib/actions/admin-actions';
import { redirect } from 'next/navigation';

export default async function AgentListPage() {
    const agents = await getAgentListAction();

    // If the uer does not have any agents, redirect to the agents page
    if (agents.length === 0) {
        redirect('/admin/agents');
    }
    return (
        <main>
            <div>
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <AgentList agents={agents} />
                </Suspense>
            </div>
        </main>
    );
}
