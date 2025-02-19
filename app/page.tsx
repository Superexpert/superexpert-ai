
import AgentList from '@/app/ui/agent-list';
import { Suspense } from 'react';
import { getAgentList } from '@/lib/server/admin-actions';

export default async function AgentListPage() {
    const agents = await getAgentList();
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
