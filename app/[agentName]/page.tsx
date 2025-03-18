import { getAgentAction, getTasksAction } from '@/lib/actions/server-actions';
import ChatBot from '@/app/ui/chat/chat-bot';

export default async function ChatPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    // Check for valid agent name
    const resolvedParams = await params;
    const agent = await getAgentAction(resolvedParams);
    const tasks = await getTasksAction(agent.id);

    return (
        <div className="mx-auto max-w-[800px]">
        <div>
            <ChatBot
                agentId={agent.id}
                agentName={agent.name}
                tasks={tasks}
            />
        </div>
    </div>
    );
}
