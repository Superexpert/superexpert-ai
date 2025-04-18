import { Suspense } from 'react';
import { Agent } from '@/lib/agent';
import AgentForm from '@/app/(admin)/ui/agent-form';
import { getAgentByIdAction } from '@/lib/actions/admin-actions';

export default async function EditAgentPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    const { id } = await params;
    const agentId = id && id.length === 1 ? id[0] : undefined;

    const isEditMode = Boolean(id);

    let agent: Agent = {
        name: '',
        description: '',
    };

    if (isEditMode) {
        agent = await getAgentByIdAction(agentId as string);
    }

    return (
        <main>
            <div>
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <AgentForm agent={agent} isEditMode={isEditMode} />
                </Suspense>
            </div>
        </main>
    );
}
