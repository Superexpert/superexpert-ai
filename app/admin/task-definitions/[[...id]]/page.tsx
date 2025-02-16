import TaskDefinitionForm from '@/app/ui/task-definition-form';
import { Suspense } from 'react';
import { getServerDataAction, getServerToolsAction, getClientToolsAction, getTaskDefinitionByIdAction } 
  from '@/lib/server/admin-actions';
import { TaskDefinition } from '@/lib/task-definition';

interface EditTaskDefinitionPageProps {
  params: { id?: string };
}

export default async function EditTaskDefinitionPage(
  {params}: EditTaskDefinitionPageProps
) {

  const { id } = await params;
  const isEditMode = Boolean(id);

  const serverData = await getServerDataAction();
  const serverTools = await getServerToolsAction();
  const clientTools = await getClientToolsAction();

  let taskDefinition:TaskDefinition = {
    isSystem: false,
    name: '',
    description: '',
    instructions: '',
    serverDataIds: [],
    serverToolIds: [],
    clientToolIds: [],
  };

  if (isEditMode) {
    taskDefinition = await getTaskDefinitionByIdAction(Number(id));
  }

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full flex-col space-y-2.5 p-4 md:-mt-32">
        <Suspense fallback={<div className="h-72 w-full animate-pulse bg-gray-100" />}>
          <TaskDefinitionForm 
            taskDefinition={taskDefinition}
            serverData={serverData}
            serverTools={serverTools}
            clientTools={clientTools}
            isEditMode={isEditMode}
          />
        </Suspense>
      </div>
    </main>
  );
}