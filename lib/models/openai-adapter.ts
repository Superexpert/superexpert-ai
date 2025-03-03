import { AIAdapter } from '@/lib/models/ai-adapter';
import { OpenAI } from 'openai';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';

export class OpenAIAdapter implements AIAdapter {

    constructor(public modelId: string) { }

    async *generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const client = new OpenAI();

        // add instructions to the inputMessages
        if (instructions) {
            inputMessages.unshift({ role: 'system', content: instructions });
        }

        const response = await client.chat.completions.create({
            model: this.modelId,
            stream: true,
            messages: inputMessages,
            ...(tools.length > 0 && { tools }), // Only add tools if tools.length > 0
        });

        const functionAccumulator = [];
        for await (const chunk of response) {
            const delta = chunk.choices[0].delta;
            if (delta.content) {
                yield { text: delta.content };
            } else if (delta.tool_calls) {
                const toolCall = delta.tool_calls[0];
                if (toolCall.function?.name) {
                    functionAccumulator.push(toolCall);
                }
                if (toolCall.function?.arguments) {
                    // Append arguments to function tool call
                    functionAccumulator[functionAccumulator.length - 1].function.arguments 
                        += toolCall.function.arguments;
                }
            } else if (chunk.choices[0].finish_reason === 'tool_calls') {
                // End of function tool calls
                for (const toolCall of functionAccumulator) {
                    yield {toolCall};
                }
            }
            
        }
    }
}
