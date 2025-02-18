import { Suspense } from 'react';
import { Agent } from '@/lib/agent';
import AgentForm from '@/app/ui/agent-form';
import { getAgentByIdAction } from '@/lib/server/admin-actions';

interface EditAgentPageProps {
  params: { id?: string };
}

export default async function EditAgentPage(
  {params}: EditAgentPageProps
) {

  const { id } = await params;
  const agentId = id && id.length === 1 ? id[0] : undefined;

  const isEditMode = Boolean(id);

  let agent:Agent = {
    name: '',
    description: '',
  };

  if (isEditMode) {
    agent = await getAgentByIdAction(agentId as string);
  }

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full flex-col space-y-2.5 p-4 md:-mt-32">
        <Suspense fallback={<div className="h-72 w-full animate-pulse bg-gray-100" />}>
          <AgentForm 
            agent={agent}
            isEditMode={isEditMode}
          />
        </Suspense>
      </div>
    </main>
  );
}