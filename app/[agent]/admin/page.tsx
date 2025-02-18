import TaskDefinitionList from '@/app/ui/task-definition-list';
import { Suspense } from 'react';
import { getTaskDefinitionList } from '@/lib/server/admin-actions';

export default async function TaskListPage() {
    const taskDefinitions = await getTaskDefinitionList();
    return (
        <main className="flex items-center justify-center md:h-screen">
        <div className="relative mx-auto flex w-full flex-col space-y-2.5 p-4 md:-mt-32">
            <Suspense fallback={<div className="h-72 w-full animate-pulse bg-gray-100" />}>
                <TaskDefinitionList taskDefinitions={taskDefinitions} />
            </Suspense>
        </div>
        </main>
    );
}
