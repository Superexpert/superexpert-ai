import { AIModel } from '@/lib/models/ai-model';
import { OpenAI } from 'openai';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';

export class GPT4oModel implements AIModel {
    private api = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    async *generateResponse(
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const client = new OpenAI();
        const response = await client.chat.completions.create({
            model: 'gpt-4o',
            stream: true,
            messages: inputMessages,
            ...(tools.length > 0 && { tools }), // Only add tools if tools.length > 0
        });

        for await (const chunk of response) {
            const text = chunk.choices[0].delta.content;
            if (text) {
                yield { text };
            } 
            // if (chunk.choices?.[0]?.delta?.content) {
            //     yield chunk.choices[0].delta.content;
            // }
        }
    }
}
