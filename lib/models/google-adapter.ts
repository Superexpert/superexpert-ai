import { AIAdapter } from '@/lib/models/ai-adapter';
import { OpenAI } from 'openai';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';

export class GoogleAdapter implements AIAdapter {

    constructor(public modelId: string) { }

    async *generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options = {}
    ) {
        const client = new OpenAI({
            apiKey: process.env.GEMINI_API_KEY,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/"
        });

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

        console.dir(tools, { depth: null });


        let toolCallId: string = '';
        let functionName: string = '';
        let functionArguments: string | undefined = '';
        for await (const chunk of response) {
            //console.dir(chunk, { depth: null });
            const delta = chunk.choices[0].delta;
            if (delta.content) {
                yield { text: delta.content };
            } else if (delta.tool_calls) {
                const toolCall = delta.tool_calls[0];

                // function tool call (Google does not stream tool calls)
                toolCallId = 'gemini-tool-' + Math.random().toString(36).substring(2, 15);
                functionName = toolCall.function!.name!;
                functionArguments = toolCall.function!.arguments;

                console.log(functionArguments);

                yield {
                    toolCall: {
                        id: toolCallId,
                        type: 'function' as const,
                        function: {
                            name: functionName,
                            arguments: functionArguments,
                        }
                    },
                };

            }
            
        }
    }
}



// import { AIAdapter } from '@/lib/models/ai-adapter';
// import { GoogleGenerativeAI, Part, Content, FunctionDeclaration } from '@google/generative-ai';
// import { MessageAI } from '@/lib/message-ai';
// import { ToolAI } from '@/lib/tool-ai';

// export class GoogleAdapter implements AIAdapter {
//     constructor(public modelId: string) {}

//     async *generateResponse(
//         instructions: string,
//         inputMessages: MessageAI[],
//         tools: ToolAI[],
//         options = {}
//     ) {
//         const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');


//         // Map tools to functionDeclarations
//         const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => ({
//             name: tool.function.name,
//             description: tool.function.description,
//             parameters: tool.function.parameters as any, // Cast to any to bypass type incompatibility
//         }));


//         const model = genAI.getGenerativeModel({ 
//             model: this.modelId, 
//             tools: [{
//                 functionDeclarations: functionDeclarations,
//             }]
//         });

//         // Map messages to Content objects
//         let history: Content[] = inputMessages
//             .map((message) => {
//                 if (message.role === "assistant") {
//                     return {
//                         role: 'model',
//                         parts: [{ text: message.content }],
//                     }
//                 }
//                 if (message.role === "tool") {
//                     return {
//                         role: 'model',
//                         parts: [{ 
//                             functionResponse: {
//                                 name: 'getWeather',
//                                 response: {
//                                   response: JSON.stringify(message.content),
//                                 },
//                             },
//                         }],
//                     }
//                 }
//                 return {
//                     role: message.role,
//                     parts: [{ text: message.content }]
//                 };
//         });

//         // Get the last message (which is either the user or tool message)
//         const lastMessage = history.pop();
//         if (!lastMessage) {
//             throw new Error('No user message found');
//         }

//         // Filter tool messages from history
//         history = history.filter(message => message.role !== 'tool');


//         const chat = model.startChat({
//             history,
//             safetySettings: [],
//             ...(instructions && {
//                 systemInstruction: {
//                     role: 'system',
//                     parts: [{ text: instructions }]
//                 },
//             }),
//         });

//         console.log("*********** history ***********");
//         console.dir(history, { depth: null });

//         console.log("*********** chat ***********");
//         console.dir(lastMessage, { depth: null });

//         // Await the sendMessageStream promise and then iterate.
//         let result;
//         // if (lastMessage.parts[0].functionResponse) {
//         //     result = await chat.sendMessage(lastMessage.parts);
//         // } else {
//             result = await chat.sendMessageStream(lastMessage.parts);
//         //}
//         //const result = await chat.sendMessageStream(lastMessage.parts);

//         let toolCallId: string = '';
//         let functionName: string = '';
//         let functionArguments: string = '';

//         for await (const chunk of result.stream) {
//             if (
//                 chunk.candidates &&
//                 chunk.candidates[0] &&
//                 chunk.candidates[0].content
//             ) {
//                 for (const part of chunk.candidates[0].content.parts) {
//                     if (part.text) {
//                         yield { text: part.text };
//                     } else if (part.functionCall) {
//                         // Function call detected
//                         if (!toolCallId) {
//                             toolCallId = 'gemini-tool-' + Math.random().toString(36).substring(2, 15);
//                             functionName = part.functionCall.name;
//                             functionArguments = JSON.stringify(part.functionCall.args);
//                             yield {
//                                 toolCall: {
//                                     id: toolCallId,
//                                     type: 'function' as const,
//                                     function: {
//                                         name: functionName,
//                                         arguments: functionArguments,
//                                     },
//                                 },
//                             };
//                         }
//                     }
//                 }
//             }
//         }
//     }
// }


// // // import { AIAdapter } from '@/lib/models/ai-adapter';
// // // import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';
// // // import { MessageAI } from '@/lib/message-ai';
// // // import { ToolAI } from '@/lib/tool-ai';

// // // export class GoogleAdapter implements AIAdapter {
// // //     constructor(public modelId: string) {}

// // //     async *generateResponse(
// // //         instructions: string,
// // //         inputMessages: MessageAI[],
// // //         tools: ToolAI[],
// // //         options = {}
// // //     ) {
// // //         const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// // //         const model = genAI.getGenerativeModel({ model: this.modelId });

// // //         // Get the last message (which is the user message)
// // //         const lastMessage = inputMessages.pop();
// // //         if (!lastMessage) {
// // //             throw new Error('No user message found');
// // //         }

// // //         // Map messages to Content objects
// // //         const history: Content[] = inputMessages.map((message) => ({
// // //             role: 'user',
// // //             parts: [{ text: message.content }]
// // //           }));


// // //         const chat = model.startChat({
// // //             history,
// // //             generationConfig: {},
// // //             safetySettings: [],
// // //             ...(instructions && {
// // //                 systemInstruction: {
// // //                     role: 'system',
// // //                     parts: [{ text: instructions }]
// // //                 },
// // //             }),
// // //         });

// // //         // Await the sendMessageStream promise and then iterate.
// // //         const result = await chat.sendMessageStream(lastMessage.content);

// // //         for await (const chunk of result.stream) {
// // //             if (
// // //                 chunk.candidates &&
// // //                 chunk.candidates[0] &&
// // //                 chunk.candidates[0].content
// // //             ) {
// // //                 for (const part of chunk.candidates[0].content.parts) {
// // //                     if (part.text) {
// // //                         yield { text: part.text };
// // //                     }
// // //                 }
// // //             }
// // //         }
// // //     }
// // // }