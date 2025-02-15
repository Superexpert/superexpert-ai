import TaskDefinitionForm from '@/app/ui/task-definition-form';
import { Suspense } from 'react';

export default function EditTaskDefinitionPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full flex-col space-y-2.5 p-4 md:-mt-32">
        <Suspense>
          <TaskDefinitionForm />
        </Suspense>
      </div>
    </main>
  );
}