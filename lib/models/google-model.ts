import { AIModel } from '@/lib/models/ai-model';
import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';

export class GoogleAIModel implements AIModel {

    constructor(public modelName: string) {}

    async *generateResponse(
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: this.modelName });

        // Extract system messages
        const systemMessages: string[] = [];
        const nonSystemMessages = inputMessages.filter(message => {
            if (message.role === 'system') {
                systemMessages.push(message.content);
                return false;
            }
            return true;
        });

        const combinedSystemMessage = systemMessages.length > 0
            ? systemMessages.join('\n\n')
            : undefined;

        // Start chat with system instruction
        const chat = model.startChat({
            history: [],
            generationConfig: {},
            safetySettings: [],
            ...(combinedSystemMessage && {
                systemInstruction: {
                    parts: [{ text: combinedSystemMessage }] as Part[],
                    role: "user", // The role must be set to user.
                } as Content,
            }),
        });

        // Format remaining messages
        const geminiMessages = nonSystemMessages.map((message) => {
            return {
                role: message.role === 'user' ? 'user' : 'model', //gemini uses model instead of assistant
                parts: message.content,
            };
        });

        // Add the history to the chat.
        for (const message of geminiMessages){
            await chat.sendMessage(message.parts);
        }

        // Await the sendMessageStream promise and then iterate.
        const result = await chat.sendMessageStream(geminiMessages.length > 0 ? "" : " ");

        for await (const chunk of result.stream) {
            if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content) {
                for (const part of chunk.candidates[0].content.parts) {
                    if (part.text) {
                        yield { text: part.text };
                    }
                }
            }
        }
    }
}

// import { AIModel } from '@/lib/models/ai-model';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { MessageAI } from '@/lib/message-ai';
// import { ToolAI } from '@/lib/tool-ai';

// export class GoogleAIModel implements AIModel {

//     constructor(public modelName: string){}


//     async *generateResponse(
//         inputMessages: MessageAI[],
//         tools: ToolAI[],
//         options = {}
//     ) {
//         const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
//         const model = genAI.getGenerativeModel({ model: this.modelName });

//         const chat = model.startChat();

//         // **Correctly format the messages for sendMessageStream:**
//         const geminiMessages = inputMessages.flatMap((message) => {  // Use flatMap
//             if (message.role === 'user') {
//                 return message.content; // User messages are just the string content
//             } else if (message.role === 'assistant') {
//                 return {
//                     text: message.content, // Ensure it matches the 'Part' type
//                 };
//             }
//             return []; // Handle other roles if needed
//         });


//         const result = await chat.sendMessageStream(geminiMessages); // Pass the formatted array

//         for await (const chunk of result.stream) {
//             if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content) {
//                 for (const part of chunk.candidates[0].content.parts) {
//                     if (part.text) {
//                         yield { text: part.text };
//                     }
//                 }
//             }
//         }
//     }
// }
