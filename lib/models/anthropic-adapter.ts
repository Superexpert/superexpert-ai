import { AIAdapter } from '@/lib/models/ai-adapter';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicAdapter implements AIAdapter {
    constructor(public modelId: string) {}

    async *generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });

        // Anthropic uses 'user' role instead of 'tool' role
        // https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview#example-api-response-with-a-tool-use-content-block
        const anthropicInputMessages = inputMessages.map(message => {
            if (message.role === 'tool') {
                return {
                    role: 'user',
                    content: [{
                        type: "tool_result",
                        tool_use_id: message.tool_call_id,
                        content: message.content,
                    }]
                };
            }
            // https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview#chain-of-thought
            if (message.role == 'assistant' && message.tool_calls) {
                return {
                    role: 'assistant',
                    content: [{
                        type: "tool_use",
                        id: message.tool_calls[0].id,
                        name: message.tool_calls[0].function.name,
                        input: JSON.parse(message.tool_calls[0].function.arguments),
                    }]
                };    
            }
            return message;
        });

        // See https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts
        // Prepend instructions to the inputMessages
        if (instructions) {
            anthropicInputMessages.unshift({ role: 'user', content: instructions });
        }


        // Set up the request parameters
        const requestParams: any = {
            model: this.modelId,
            messages: anthropicInputMessages,
            // system: instructions,
            max_tokens: 4096,
            stream: true,
            //tool_choice: { type: 'auto', disable_parallel_tool_use: false },
            //thinking: { budget_tokens: 1024, type: 'enabled' },
        };


        // Add tools if provided
        if (tools.length > 0) {
            requestParams.tools = tools.map(tool => ({
                name: tool.function.name,
                description: tool.function.description,
                input_schema: tool.function.parameters,
            }));
        }

        try {
            // Create the streaming response - the stream itself is an AsyncIterable
            const response = await client.messages.stream(requestParams);            
            const functionAccumulator = [];

            // Process stream directly
            for await (const chunk of response) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    yield { text: chunk.delta.text };
                } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
                    // Start of function tool call
                    functionAccumulator.push({
                        //toolCall: {
                            id: chunk.content_block.id,
                            type: 'function',
                            function: {
                                name: chunk.content_block.name,
                                arguments: '',
                            }
                        //}
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
        } catch (error) {
            console.error("Error in Anthropic streaming:", error);
            throw error;
        }
    }
}