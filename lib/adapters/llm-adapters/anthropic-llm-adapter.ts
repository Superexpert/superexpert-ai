import { LLMAdapter } from '@/lib/adapters/llm-adapters/llm-adapter';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicLLMAdapter extends LLMAdapter {

    // Anthropic uses 'user' role instead of 'tool' role
    // https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview#example-api-response-with-a-tool-use-content-block
    public mapMessages(inputMessages: MessageAI[]): MessageAI[] {
        return inputMessages.map(message => {
            if (message.role === 'tool') {
                return {
                    ...message,
                    role: 'user',
                    content: JSON.stringify([{
                        type: "tool_result",
                        tool_use_id: message.tool_call_id,
                        content: message.content,
                    }])
                } as MessageAI;
            }
            // https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview#chain-of-thought
            if (message.role == 'assistant' && message.tool_calls) {
                return {
                    ...message,
                    role: 'assistant',
                    content: JSON.stringify([{
                        type: "tool_use",
                        id: message.tool_calls[0].id,
                        name: message.tool_calls[0].function.name,
                        input: JSON.parse(message.tool_calls[0].function.arguments),
                    }])
                } as MessageAI;    
            }
            return message;
        });
    }

    public mapTools(tools: ToolAI[]) {
        return tools.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            input_schema: tool.function.parameters,
        }));
    }

    async *generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
    ) {
        const client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });

        const anthropicInputMessages = this.mapMessages(inputMessages);


        // See https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts
        // Prepend instructions to the inputMessages
        if (instructions) {
            anthropicInputMessages.unshift({ role: 'user', content: instructions });
        }


        // Set up the request parameters
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestParams: any = {
            model: this.modelId,
            messages: anthropicInputMessages,
            // system: instructions,
            max_tokens: this.modelConfiguration?.maximumOutputTokens || 4096,
            temperature: this.modelConfiguration?.temperature || 0.7,
            stream: true,
            //tool_choice: { type: 'auto', disable_parallel_tool_use: false },
            //thinking: { budget_tokens: 1024, type: 'enabled' },
        };


        // Add tools if provided
        if (tools.length > 0) {
            requestParams.tools = this.mapTools(tools);
        }

        // Call OpenAI and process the chunks with retry logic
        yield* this.retryWithBackoff(async () => {
            const response = client.messages.stream(requestParams);            
            return this.processChunks(response);
        });
    }


    private async *processChunks(
        response: AsyncIterable<Anthropic.MessageStreamEvent>
    ) {
        const functionAccumulator = [];

        // Process stream directly
        for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                yield { text: chunk.delta.text };
            } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
                // Start of function tool call
                functionAccumulator.push({
                        id: chunk.content_block.id,
                        type: 'function' as const,
                        function: {
                            name: chunk.content_block.name,
                            arguments: '',
                        }
                });
            } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'input_json_delta') {
                // Append arguments to function tool call
                functionAccumulator[functionAccumulator.length - 1].function.arguments 
                    += chunk.delta.partial_json;
            } else if (chunk.type === 'message_delta' && chunk.delta.stop_reason === 'tool_use') {
                for (const toolCall of functionAccumulator) {
                    yield {toolCall};
                }
            }
        }
    }


}