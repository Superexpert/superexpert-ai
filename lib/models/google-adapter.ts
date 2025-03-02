import { AIAdapter } from '@/lib/models/ai-adapter';
import { OpenAI } from 'openai';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';

export class GoogleAdapter implements AIAdapter {

    constructor(public modelId: string) { }

    async *generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const client = new OpenAI({
            apiKey: process.env.GEMINI_API_KEY,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/"
        });

        // add instructions to the inputMessages
        if (instructions) {
            inputMessages.unshift({ role: 'system', content: instructions });
        }

        // console.log("inputMessages");
        // console.dir(inputMessages, { depth: null });

        // console.log("tools");
        // console.dir(tools, { depth: null });

        const response = await client.chat.completions.create({
            model: this.modelId,
            stream: true,
            messages: inputMessages,
            ...(tools.length > 0 && { tools }), // Only add tools if tools.length > 0
        });

        let toolCallId: string = '';
        let functionName: string = '';
        let functionArguments: string | undefined = '';
        for await (const chunk of response) {
            const delta = chunk.choices[0].delta;
            if (delta.content) {
                yield { text: delta.content };
            } else if (delta.tool_calls) {
                const toolCall = delta.tool_calls[0];

                // function tool call (Google does not stream tool calls)
                toolCallId = 'gemini-tool-' + Math.random().toString(36).substring(2, 15);
                functionName = toolCall.function!.name!;
                functionArguments = toolCall.function!.arguments;

                yield {
                    toolCall: {
                        id: toolCallId,
                        type: 'function' as const,
                        function: {
                            name: functionName,
                            arguments: functionArguments,
                        }
                    },
                };

            }
            
        }
    }
}

