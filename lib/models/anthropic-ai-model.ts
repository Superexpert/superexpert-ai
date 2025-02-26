import { AIModel } from '@/lib/models/ai-model';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import { Anthropic } from '@anthropic-ai/sdk';

export class AnthropicAIModel implements AIModel {

    async *generateResponse(
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });

        // Extract all system messages from inputMessages
        const systemMessages: string[] = [];
        const nonSystemMessages = inputMessages.filter(message => {
            if (message.role === 'system') {
                // Collect all system messages
                systemMessages.push(message.content);
                return false; // Remove this message from the array
            }
            return true; // Keep non-system messages
        });

        // Combine all system messages into a single system instruction
        // Each system message is separated by two newlines for clarity
        const combinedSystemMessage = systemMessages.length > 0 
            ? systemMessages.join('\n\n')
            : undefined;

        // Convert remaining MessageAI[] to Anthropic message format
        let anthropicMessages = nonSystemMessages.map((message) => {
            return {
                role: message.role === 'user' ? 'user' : 'assistant',
                content: message.content,
            } as { role: 'user' | 'assistant'; content: string };
        });

        if (anthropicMessages.length === 0) {
            anthropicMessages = [{
                role: 'user',
                content: 'Hello'
            }];
        }

        // // Format tools for Anthropic if needed
        // const anthropicTools = tools.length > 0 ? tools.map(tool => ({
        //     name: tool.name,
        //     description: tool.description,
        //     input_schema: tool.parameters,
        // })) : undefined;

        // Default to Claude 3.7 Sonnet unless specified in options
        const modelName = 'claude-3-7-sonnet-20250219';

        const response = await client.messages.create({
            model: modelName,
            messages: anthropicMessages,
            system: combinedSystemMessage, // Pass combined system messages
            stream: true,
            max_tokens: 1000, // Add appropriate value for max_tokens
        });

        for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
                yield { text: chunk.delta.text };
            }
        }
    }
}