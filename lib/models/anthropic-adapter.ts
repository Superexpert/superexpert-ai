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

        // See https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts
        // Prepend instructions to the inputMessages
        if (instructions) {
            inputMessages.unshift({ role: 'user', content: instructions });
        }


        // Set up the request parameters
        const requestParams: any = {
            model: this.modelId,
            messages: inputMessages,
            // system: instructions,
            max_tokens: 4096,
            stream: true
        };


        // Add tools if provided
        // if (tools.length > 0) {
        //     requestParams.tools = tools.map(tool => ({
        //         name: tool.name,
        //         description: tool.description,
        //         input_schema: tool.parameters,
        //     }));
        // }

        try {
            // Create the streaming response - the stream itself is an AsyncIterable
            const stream = await client.messages.stream(requestParams);
            
            // Process stream directly
            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    yield { text: chunk.delta.text };
                } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
                    // yield { 
                    //     text: "",
                    //     toolUse: {
                    //         name: chunk.content_block.name,
                    //         input: JSON.parse(chunk.content_block.input)
                    //     }
                    // };
                }
            }
        } catch (error) {
            console.error("Error in Anthropic streaming:", error);
            throw error;
        }
    }
}