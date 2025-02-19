import { validateAgentParam } from "@/lib/server/server-actions";
import ChatContainer from "@/app/_components/chat-container";

export default async function ChatPage({ params }: { params: Promise<{ [key: string]: string }> }) {

  // Check for valid agent name
  const resolvedParams = await params;
  const agentName = await validateAgentParam(resolvedParams);

  return <ChatContainer agentName={agentName} />;
}

