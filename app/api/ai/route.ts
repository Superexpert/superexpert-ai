import { NextRequest } from "next/server";
import OpenAI from "openai";
import { MessageAI, ToolCall } from "@/lib/message";
import { TaskMachine } from "@/lib/task-machine";

interface RequestBody {
    nowString: string;
    timeZone: string;
    messages: MessageAI[];
    task: string;
    thread: string;
}

export async function POST(request: NextRequest): Promise<Response> {
    // Authenticate the user
    // const session = await auth0.getSession();
    // if (!session) {
    //     console.error("User not authenticated");
    //     return new Response("User not authenticated!", { status: 401 });
    // }
    // const userId = session.user.sub;
    const userId = "1234";

    // Await the JSON response and type it accordingly
    const body: RequestBody = await request.json();

    // Destructure the properties from the body
    const { nowString, timeZone, messages, task, thread} = body;
    const now = new Date(nowString);
    //console.dir(body, { depth: null });

    const taskMachine = new TaskMachine();
    const {currentMessages, tools} = await taskMachine.getAIPayload(
        userId,
        task,
        thread,
        messages,
    );

    // console.log("currentMessages:");
    // console.dir(currentMessages, { depth: null });

    // console.log("payload tools according to route:");
    // console.dir(tools, { depth: null });


    const client = new OpenAI();
    const stream = await client.chat.completions.create({
        model: "gpt-4o",
        stream: true,
        messages: currentMessages,
        ...(tools.length > 0 && { tools }) // Only add tools if tools.length > 0
    });

    // ReadableStream that will be sent to the client
    const readableStream = new ReadableStream({
        async start(controller) {
            let fullResponse = ""; // Buffer to store the full response
            const toolCalls: ToolCall[] = []; // Store tool call IDs
            const reader = stream.toReadableStream().getReader();

            // // add custom info to client stream
            // const encoder = new TextEncoder();
            // const stateNameChunk = getCustomChunck("custom.state.name", currentStateName);
            // controller.enqueue(encoder.encode(`${stateNameChunk}\n`));            
            // const threadChunk = getCustomChunck("custom.thread", currentThread);
            // controller.enqueue(encoder.encode(`${threadChunk}\n`));            

            
            async function processStream() {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        // Save the full response
                        await taskMachine.saveMessages(
                            userId, 
                            task, 
                            thread,
                            [{
                                role:'assistant', 
                                content:fullResponse,
                                tool_calls:toolCalls
                            }]
                        );

                        // Perform tool calls
                        console.log("toolCalls:");
                        console.dir(toolCalls, { depth: null });

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
                                toolCalls[toolCalls.length-1].function.arguments += tool_call.function.arguments;
                            }
                        }
                    } catch (error) {
                        console.error("Error parsing JSON chunk:", error);
                    }
                }
            }

            processStream().catch((error) => {
                console.error("Error processing stream:", error);
                controller.error(error);
            });
        },
    });

    return new Response(readableStream, {
        headers: { "Content-Type": "text/event-stream" },
    });
}


function getCustomChunck(id:string, value:string):string {
    const customChunk = JSON.stringify({
        id,
        object: "chat.completion.chunk",
        created: Date.now(),
        model: "gpt-4",
        choices: [
            {
                index: 0,
                delta: { role: "assistant", content: value, refusal: null, logprobs: null },
                finish_reason: "stop"
            },
        ],
    });
    return customChunk;
}