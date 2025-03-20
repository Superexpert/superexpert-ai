import TaskDefinitionForm from '@/app/ui/task-definition-form';
import { Suspense } from 'react';
import { getAgentAction } from '@/lib/actions/server-actions';
import {
    getTaskDefinitionFormDataAction,
    getTaskDefinitionByIdAction,
} from '@/lib/actions/admin-actions';
import { TaskDefinition } from '@/lib/task-definition';

export default async function EditTaskDefinitionPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    // Check for valid agent name
    const resolvedParams = await params;
    const agent = await getAgentAction(resolvedParams);

    const { id } = await params;
    const taskId = id && id.length === 1 ? id[0] : undefined;

    const isEditMode = Boolean(id);

    const { attachments, corpora, serverData, serverTools, clientTools, llmModels } =
        await getTaskDefinitionFormDataAction(taskId);

    let taskDefinition: TaskDefinition = {
        agentId: agent.id,
        isSystem: false,
        name: '',
        description: '',
        instructions: '',
        startNewThread: false,
        corpusLimit: 3,
        corpusSimilarityThreshold: 50,
        corpusIds: [],
        serverDataIds: [],
        serverToolIds: [],
        clientToolIds: [],
        modelId: 'global',
        maximumOutputTokens: null,
        temperature: null,
        theme: 'global',
    };

    if (isEditMode) {
        taskDefinition = await getTaskDefinitionByIdAction(taskId!);
    }

    return (
        <main>
            <Suspense
                fallback={
                    <div className="h-72 w-full animate-pulse bg-gray-100" />
                }>
                <TaskDefinitionForm
                    agentId={agent.id}
                    agentName={agent.name}
                    taskDefinition={taskDefinition}
                    attachments={attachments}
                    corpora={corpora}
                    serverData={serverData}
                    serverTools={serverTools}
                    clientTools={clientTools}
                    llmModels={llmModels}
                    isEditMode={isEditMode}
                />
            </Suspense>
        </main>
    );
}
