import TaskDefinitionForm from '@/app/ui/task-definition-form';
import { Suspense } from 'react';
import { getServerTools, getTaskDefinitionById } from '@/lib/server/admin-actions';
import { TaskDefinition } from '@/lib/task-definition';

interface EditTaskDefinitionPageProps {
  params: { id?: string };
}

export default async function EditTaskDefinitionPage(
  {params}: EditTaskDefinitionPageProps
) {

  const { id } = await params;
  const isEditMode = Boolean(id);

  const serverTools = await getServerTools();
  let taskDefinition:TaskDefinition = {
    isSystem: false,
    name: '',
    description: '',
    instructions: '',
    serverToolIds: [],
  };

  if (isEditMode) {
    taskDefinition = await getTaskDefinitionById(Number(id));
  }

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full flex-col space-y-2.5 p-4 md:-mt-32">
        <Suspense fallback={<div className="h-72 w-full animate-pulse bg-gray-100" />}>
          <TaskDefinitionForm 
            taskDefinition={taskDefinition}
            serverTools={serverTools}
            isEditMode={isEditMode}
          />
        </Suspense>
      </div>
    </main>
  );
}