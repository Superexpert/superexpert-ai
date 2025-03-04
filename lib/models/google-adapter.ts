import { AIAdapter } from '@/lib/models/ai-adapter';
import {
    GoogleGenerativeAI,
    Part,
    Content,
    FunctionDeclaration,
    EnhancedGenerateContentResponse,
} from '@google/generative-ai';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import { ToolCall } from '@/lib/tool-call';
import { ChunkAI } from '../chunk-ai';

export class GoogleAdapter extends AIAdapter {
    private collapseFunctionResponses(messages: Content[]): Content[] {
        const collapsedMessages: Content[] = [];
        let functionResponses: Part[] = [];
        let functionCallIndex = -1;

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];

            if (
                message.role === 'model' &&
                message.parts.some((part) => part.functionCall)
            ) {
                if (functionCallIndex !== -1 && functionResponses.length > 0) {
                    collapsedMessages.splice(functionCallIndex + 1, 0, {
                        role: 'function',
                        parts: functionResponses,
                    });
                    functionResponses = [];
                }
                functionCallIndex = i;
                collapsedMessages.push(message);
            } else if (
                message.role === 'function' &&
                message.parts.some((part) => part.functionResponse)
            ) {
                if (functionCallIndex !== -1 && i > functionCallIndex) {
                    functionResponses = functionResponses.concat(message.parts);
                } else {
                    collapsedMessages.push(message);
                }
            } else {
                if (
                    functionCallIndex !== -1 &&
                    message.role === 'model' &&
                    message.parts.some((part) => part.text)
                ) {
                    if (functionResponses.length > 0) {
                        collapsedMessages.splice(functionCallIndex + 1, 0, {
                            role: 'function',
                            parts: functionResponses,
                        });
                        functionResponses = [];
                    }
                    functionCallIndex = -1;
                    collapsedMessages.push(message);
                } else {
                    collapsedMessages.push(message);
                }
            }
        }

        if (functionCallIndex !== -1 && functionResponses.length > 0) {
            collapsedMessages.splice(functionCallIndex + 1, 0, {
                role: 'function',
                parts: functionResponses,
            });
        }

        return collapsedMessages;
    }

    async *generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

        // Map tools to functionDeclarations
        const functionDeclarations: FunctionDeclaration[] = tools.map(
            (tool) => ({
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.parameters as any, // Cast to any to bypass type incompatibility
            })
        );

        const model = genAI.getGenerativeModel({
            model: this.modelId,
            tools: [
                {
                    functionDeclarations: functionDeclarations,
                },
            ],
        });

        // Map messages to Content objects
        let history: Content[] = inputMessages.map((message) => {
            switch (message.role) {
                case 'assistant':
                    return message.tool_calls
                        ? {
                              role: 'model',
                              parts: message.tool_calls.map((toolCall) => ({
                                  functionCall: {
                                      name: toolCall.id,
                                      args: JSON.parse(toolCall.function.arguments),
                                  },
                              })),
                          }
                        : { role: 'model', parts: [{ text: message.content }] };
        
                case 'tool':
                    return {
                        role: 'function',
                        parts: [
                            {
                                functionResponse: {
                                    name: message.tool_call_id,
                                    response: { result: message.content },
                                },
                            },
                        ],
                    };
        
                default:
                    return { role: message.role, parts: [{ text: message.content || '???' }] };
            }
        });
        // let history: Content[] = inputMessages.map((message) => {
        //     if (message.role === 'assistant') {
        //         if (message.tool_calls) {
        //             const functionCalls: Part[] = [];
        //             for (const toolCall of message.tool_calls) {
        //                 const functionCall: Part = {
        //                     functionCall: {
        //                         name: toolCall.id,
        //                         args: JSON.parse(toolCall.function.arguments),
        //                     },
        //                 };
        //                 functionCalls.push(functionCall);
        //             }
        //             return {
        //                 role: 'model',
        //                 parts: functionCalls,
        //             };
        //         }
        //         return {
        //             role: 'model',
        //             parts: [{ text: message.content }],
        //         };
        //     }
        //     if (message.role === 'tool') {
        //         // Corrected: functionResponse is a direct Part property
        //         const functionPart: Part = {
        //             functionResponse: {
        //                 name: message.tool_call_id,
        //                 response: { result: message.content },
        //             },
        //         };
        //         return {
        //             role: 'function',
        //             parts: [functionPart],
        //         };
        //     }

        //     // Otherwise, it's a user message
        //     return {
        //         role: message.role,
        //         parts: [{ text: message.content || '???' }],
        //     };
        // });

        history = this.collapseFunctionResponses(history);

        // Get the last message (which is either the user or tool message)
        const lastMessage = history.pop();
        if (!lastMessage) {
            throw new Error('No last message found');
        }

        let retries = 0;
        const maxRetries = 3;

        while (retries <= maxRetries) {
            try {
                const chat = model.startChat({
                    history,
                    safetySettings: [],
                    ...(instructions && {
                        systemInstruction: {
                            role: 'system',
                            parts: [{ text: instructions }],
                        },
                    }),
                });
                const result = await chat.sendMessageStream(lastMessage.parts);

                console.log(
                    `Processing chunks attempt ${retries + 1}/${maxRetries + 1}`
                );
                yield* this.processChunks(result.stream);
                break;
            } catch (error) {
                if (++retries > maxRetries) {
                    console.error(
                        'Maximum retries reached for processing chunks'
                    );
                    throw error;
                }

                console.log(
                    `Retrying entire operation (${retries}/${maxRetries})`
                );
            }
        }
    }

    async *processChunks(
        stream: AsyncGenerator<EnhancedGenerateContentResponse, any, any>
    ): AsyncGenerator<ChunkAI> {
        const functionAccumulator: ToolCall[] = [];

        console.log('iterating chunks');
        for await (const chunk of stream) {
            // console.log('CHUNK');
            // console.log(JSON.stringify(chunk, null, 2));

            if (chunk.candidates && chunk.candidates[0]) {
                if (chunk.candidates[0].content) {
                    for (const part of chunk.candidates[0].content.parts) {
                        if (part.text) {
                            yield { text: part.text };
                        } else if (part.functionCall) {
                            functionAccumulator.push({
                                id: part.functionCall.name,
                                type: 'function' as const,
                                function: {
                                    name: part.functionCall.name,
                                    arguments: JSON.stringify(
                                        part.functionCall.args
                                    ),
                                },
                            });
                        }
                    }
                } else {
                    // Function call failed for mysterious reason, force a retry
                    if (
                        chunk.candidates[0].finishReason ===
                        'MALFORMED_FUNCTION_CALL'
                    ) {
                        console.log('CHUNK Error');
                        console.log(JSON.stringify(chunk, null, 2));

                        throw new Error('MALFORMED_FUNCTION_CALL');
                    }
                }
            }
        }

        for (const toolCall of functionAccumulator) {
            yield { toolCall };
        }
    }
}
