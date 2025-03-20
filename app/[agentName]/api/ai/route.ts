import '@/superexpertai.plugins.server'; // Ensure plugins are loaded
import { NextRequest } from 'next/server';
import { MessageAI } from '@/lib/message';
import { TaskMachine } from '@/lib/task-machine';
import { auth } from '@/auth';
import { User } from '@/lib/user';
import { DBAdminService } from '@/lib/db/db-admin-service';
import { LLMModelFactory } from '@/lib/adapters/llm-adapters/llm-model-factory';

interface RequestBody {
    nowString: string;
    timeZone: string;
    messages: MessageAI[];
    task: string;
    thread: string;
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ agentName: string }> }
): Promise<Response> {
    // Get user id
    const session = await auth();
    if (!session || !session.user) {
        throw new Error('User not authenticated');
    }
    const user = session.user as User;

    // Get agent
    const { agentName } = await context.params;
    const db = new DBAdminService(user.id);
    const agent = await db.getAgentByName(agentName);
    if (!agent) {
        throw new Error('Agent not found');
    }

    // Await the JSON response and type it accordingly
    const body: RequestBody = await request.json();

    // Destructure the properties from the body
    const { nowString, timeZone, messages, task, thread } = body;
    user.now = new Date(nowString);
    user.timeZone = timeZone;

    const taskMachine = new TaskMachine();
    const {
        instructions,
        currentMessages,
        tools,
        modelId: initialModelId,
        modelConfiguration: initialModelConfiguration,
    } = await taskMachine.getAIPayload(user, agent.id, agentName, task, thread, messages);
    let modelId = initialModelId;
    let modelConfiguration = initialModelConfiguration;

    // If DemoMode then always use GPT-4o mini
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (isDemoMode) {
        modelId = 'gpt-4o-mini';
        modelConfiguration = {
            temperature: 0.7,
            maximumOutputTokens: 2048,
        };
    }

    // Create a new AI Model
    const model = LLMModelFactory.createModel(modelId, modelConfiguration);

    const response = model.generateResponse(
        instructions,
        currentMessages,
        tools
    );

    const readableStream = new ReadableStream({
        async start(controller) {
            let fullMessage = ''; // Buffer to store the full message
            const toolCalls = []; // Store tool call IDs
            const encoder = new TextEncoder();
            for await (const chunk of response) {
                controller.enqueue(
                    encoder.encode(
                        `event: message\ndata: ${JSON.stringify(chunk)}\n\n`
                    )
                );
                if (chunk.text) {
                    fullMessage += chunk.text;
                }
                if (chunk.toolCall) {
                    toolCalls.push(chunk.toolCall);
                }
            }
            controller.close();

            // Save the full message
            await taskMachine.saveMessages(user.id, agent!.id, task, thread, [
                {
                    role: 'assistant',
                    content: fullMessage,
                    tool_calls: toolCalls,
                },
            ]);
        },
    });

    return new Response(readableStream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
        },
    });
}
