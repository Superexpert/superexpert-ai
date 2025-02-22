import { getAgentAction } from '@/lib/server/server-actions';
import ChatContainer from '@/app/ui/chat/chat-container';

export default async function ChatPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    // Check for valid agent name
    const resolvedParams = await params;
    const agent = await getAgentAction(resolvedParams);

    return <ChatContainer agentId={agent.id} agentName={agent.name} />;
}
