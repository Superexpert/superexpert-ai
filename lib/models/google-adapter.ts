import { AIAdapter } from '@/lib/models/ai-adapter';
import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';

export class GoogleAdapter implements AIAdapter {
    constructor(public modelId: string) {}

    async *generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: this.modelId });

        // Get the last message (which is the user message)
        const lastMessage = inputMessages.pop();
        if (!lastMessage) {
            throw new Error('No user message found');
        }

        // Map messages to Content objects
        const history: Content[] = inputMessages.map((message) => ({
            role: 'user',
            parts: [{ text: message.content }]
          }));


        const chat = model.startChat({
            history,
            generationConfig: {},
            safetySettings: [],
            ...(instructions && {
                systemInstruction: {
                    role: 'system',
                    parts: [{ text: instructions }]
                },
            }),
        });

        // Await the sendMessageStream promise and then iterate.
        const result = await chat.sendMessageStream(lastMessage.content);

        for await (const chunk of result.stream) {
            if (
                chunk.candidates &&
                chunk.candidates[0] &&
                chunk.candidates[0].content
            ) {
                for (const part of chunk.candidates[0].content.parts) {
                    if (part.text) {
                        yield { text: part.text };
                    }
                }
            }
        }
    }
}