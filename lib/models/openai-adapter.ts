import { AIAdapter } from '@/lib/models/ai-adapter';
import { OpenAI } from 'openai';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import { ToolCall } from '@/lib/tool-call';

export class OpenAIAdapter extends AIAdapter {
    async *generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        console.log("Using OpenAI Adapter");


        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error(
                'OpenI API key not found. Please set the OPENAI_API_KEY environment variable.'
            );
        }
        const client = new OpenAI({ apiKey: apiKey });

        // add instructions to the inputMessages
        if (instructions) {
            inputMessages.unshift({ role: 'system', content: instructions });
        }

        console.log("Input Messages");
        console.dir(inputMessages, { depth: null });

        // Call OpenAI and process the chunks with retry logic
        yield* this.retryWithBackoff(async () => {
            const response = await client.chat.completions.create({
                model: this.modelId,
                stream: true,
                max_completion_tokens: this.modelConfiguration.maximumOutputTokens || 16384,
                temperature: this.modelConfiguration.temperature || 1.0,
                messages: inputMessages,
                ...(tools.length > 0 && { tools }), // Only add tools if tools.length > 0
            });

            return this.processChunks(response);
        });
    }

    private async *processChunks(
        response: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
    ) {
        const functionAccumulator: ToolCall[] = [];
        for await (const chunk of response) {
            const delta = chunk.choices[0].delta;
            if (delta.content) {
                yield { text: delta.content };
            } else if (delta.tool_calls) {
                const toolCall = delta.tool_calls[0];
                if (toolCall.function?.name) {
                    functionAccumulator.push(toolCall as ToolCall);
                }
                if (toolCall.function?.arguments) {
                    // Append arguments to function tool call
                    functionAccumulator[
                        functionAccumulator.length - 1
                    ].function!.arguments += toolCall.function.arguments;
                }
            } else if (chunk.choices[0].finish_reason === 'tool_calls') {
                // End of function tool calls
                for (const toolCall of functionAccumulator) {
                    yield { toolCall };
                }
            }
        }
    }
}
