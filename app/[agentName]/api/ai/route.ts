import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { MessageAI, ToolCall } from '@/lib/message';
import { TaskMachine } from '@/lib/task-machine';
import { auth } from '@/auth';
import { User } from '@/lib/user';
import { DBAdminService } from '@/lib/db/db-admin-service';

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
    const {agentName} = await context.params;
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
    const { currentMessages, tools } = await taskMachine.getAIPayload(
        user,
        agent.id,
        task,
        thread,
        messages
    );

    console.log(currentMessages);

    const client = new OpenAI();
    const stream = await client.chat.completions.create({
        model: 'gpt-4o',
        stream: true,
        messages: currentMessages,
        ...(tools.length > 0 && { tools }), // Only add tools if tools.length > 0
    });

    // ReadableStream that will be sent to the client
    const readableStream = new ReadableStream({
        async start(controller) {
            let fullResponse = ''; // Buffer to store the full response
            const toolCalls: ToolCall[] = []; // Store tool call IDs
            const reader = stream.toReadableStream().getReader();

            async function processStream() {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        // Save the full response
                        await taskMachine.saveMessages(user.id, agent!.id, task, thread, [
                            {
                                role: 'assistant',
                                content: fullResponse,
                                tool_calls: toolCalls,
                            },
                        ]);

                        controller.close();
                        break;
                    }
                    const textChunk = new TextDecoder().decode(value);
                    controller.enqueue(value); // Send chunk to client

                    try {
                        // Parse the JSON object
                        const jsonChunk = JSON.parse(textChunk);
                        const choice = jsonChunk.choices?.[0]?.delta;

                        // Append assistant content if present
                        if (choice?.content) {
                            fullResponse += choice.content;
                        }

                        // Handle tool calls
                        if (choice?.tool_calls) {
                            const tool_call = choice.tool_calls[0];
                            if (tool_call.function.name) {
                                toolCalls.push(tool_call);
                            } else {
                                toolCalls[
                                    toolCalls.length - 1
                                ].function.arguments +=
                                    tool_call.function.arguments;
                            }
                        }
                    } catch (error) {
                        console.error('Error parsing JSON chunk:', error);
                    }
                }
            }

            processStream().catch((error) => {
                console.error('Error processing stream:', error);
                controller.error(error);
            });
        },
    });

    return new Response(readableStream, {
        headers: { 'Content-Type': 'text/event-stream' },
    });
}
