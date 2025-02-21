import TaskDefinitionList from '@/app/ui/task-definition-list';
import { getAgentAction } from "@/lib/server/server-actions";
import { Suspense } from 'react';
import { getTaskDefinitionList } from '@/lib/server/admin-actions';

export default async function TaskListPage(
    { params }: { params: Promise<{ [key: string]: string }> }
) {
    // Check for valid agent name
    const resolvedParams = await params;
    const agent = await getAgentAction(resolvedParams);

    const taskDefinitions = await getTaskDefinitionList();
    return (
        <main className="flex items-center justify-center md:h-screen">
        <div className="relative mx-auto flex w-full flex-col space-y-2.5 p-4 md:-mt-32">
            <Suspense fallback={<div className="h-72 w-full animate-pulse bg-gray-100" />}>
                <TaskDefinitionList agentName={agent.name} taskDefinitions={taskDefinitions} />
            </Suspense>
        </div>
        </main>
    );
}
