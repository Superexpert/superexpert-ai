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

        for await (const chunk of response) {
            const text = chunk.choices[0].delta.content;
            if (text) {
                yield { text };
            } 
        }
    }
}
