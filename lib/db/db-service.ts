import { MessageAI } from '../message-ai';
import { TaskDefinition } from '../task-definition';
import {prisma} from './prisma';

export class DBService {

    public async saveMessages(userId:string, task:string, thread:string, messages: MessageAI[]) {
        const fullMessages = messages.map(m => {
            return {
                userId: userId,
                task: task,
                thread: thread,
                role: m.role,
                content: m.content,
                ...('tool_calls' in m && m.tool_calls?.length ? {tool_calls: JSON.stringify(m.tool_calls)}:{}),
                ...('tool_call_id' in m ? {tool_call_id: m.tool_call_id}:{}),
            }
        });

        const newMessages = await prisma.messages.createMany({
            data: fullMessages
        });
        return newMessages;
    }

    public async getMessages(userId:string, thread:string, take:number, ): Promise<MessageAI[]> {
        const messages = await prisma.messages.findMany({
            where: {
                userId: userId,
                thread: thread,
            },
            orderBy: {
                    id: 'desc'
            },
            take: take
        }) || [];

        const processedMessages = messages.reverse().map(m => ({
                role: m.role as "system" | "user" | "assistant" | "tool",
                content: m.content,
                ...(m.tool_calls ? { tool_calls: JSON.parse(m.tool_calls as string) } : {}),
                ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}), 
        }) as MessageAI);

        // Remove all leading 'tool' messages
        const firstNonToolIndex = processedMessages.findIndex(m => m.role !== 'tool');
        const resultMessages = firstNonToolIndex === -1 ? [] : processedMessages.slice(firstNonToolIndex);
        return resultMessages;
    }


    public async getTaskDefinitions() {
        const taskDefinitions = await prisma.taskDefinitions.findMany();
        return taskDefinitions.map(td => {
            return {
                id: td.id,
                name: td.name,
                instructions: td.instructions,
                serverToolIds: td.serverToolIds.split(','),
            }});
    }


    // public async getTaskDefinition(task:string):Promise<TaskDefinition> {
    //     const td = await prisma.taskDefinitions.findUnique({
    //         where: {
    //             name: task
    //         }
    //     });
    //     if (td === null) {
    //         throw new Error(`Task definition not found for task: ${task}`);
    //     }
    //     return {
    //         name: td.name,
    //         instructions: td.instructions,
    //         serverToolIds: td.serverToolIds.split(',')
    //     }
    // }


}