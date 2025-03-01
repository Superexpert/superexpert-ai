'use client';

import ChatBot from '@/app/ui/chat/chat-bot';
import { ToolCall } from '@/lib/message';
import { executeServerTool } from '@/lib/server/server-actions';
import { ClientToolsBuilder } from '@/lib/client-tools-builder';

export default function ChatContainer({
    agentId,
    agentName,
}: {
    agentId: string;
    agentName: string;
}) {
    // const functionCallHandler = async (
    //     now: Date,
    //     timeZone: string,
    //     toolCall: ToolCall
    // ) => {
    //     const functionName = toolCall.function.name;
    //     const functionArgs = JSON.parse(toolCall.function.arguments);

    //     console.log('calling function', functionName);
    //     console.log('function arguments', functionArgs);

    //     // Execute client tool
    //     const clientToolsBuilder = new ClientToolsBuilder();
    //     const clientTool = clientToolsBuilder.getClientTool(functionName);
    //     console.log('client tool found?', clientTool);
    //     if (clientTool) {
    //         const result = clientToolsBuilder.callClientTool(
    //             clientTool.methodName,
    //             functionArgs
    //         );
    //         console.log('client tool result', result);
    //         return Promise.resolve(result);
    //     }

    //     // Execute server tool
    //     const result = await executeServerTool(
    //         now,
    //         timeZone,
    //         functionName,
    //         functionArgs
    //     );
    //     console.log('client tool result', result);
    //     return Promise.resolve(result);
    // };

    return (
        <div className="mx-auto max-w-[800px]">
            <div>
                <ChatBot
                    agentId={agentId}
                    agentName={agentName}
                />
            </div>
        </div>
    );
}
