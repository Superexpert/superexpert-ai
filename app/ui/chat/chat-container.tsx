'use client';

import ChatBot from '@/app/ui/chat/chat-bot';
import { ToolCall } from '@/lib/message';
import { executeServerTool } from '@/lib/server/server-actions';
import { ClientToolsBuilder } from '@/lib/client-tools-builder';
import { ClientTaskDefinition } from '@/lib/client/client-task-definition';

export default function ChatContainer({
    agentId,
    agentName,
    tasks,
}: {
    agentId: string;
    agentName: string;
    tasks: ClientTaskDefinition[];
}) {

    return (
        <div className="mx-auto max-w-[800px]">
            <div>
                <ChatBot
                    agentId={agentId}
                    agentName={agentName}
                    tasks={tasks}
                />
            </div>
        </div>
    );
}
