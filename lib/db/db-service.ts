import { MessageAI } from '../message-ai';
import { getAgentByIdAction } from '../server/admin-actions';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export class DBService {
    public async saveMessages(
        userId: string,
        agentId: string,
        task: string,
        thread: string,
        messages: MessageAI[]
    ) {
        const fullMessages = messages.map((m) => {
            return {
                userId: userId,
                agentId: agentId,
                task: task,
                thread: thread,
                role: m.role,
                content: m.content,
                ...('tool_calls' in m && m.tool_calls?.length
                    ? { tool_calls: JSON.stringify(m.tool_calls) }
                    : {}),
                ...('tool_call_id' in m
                    ? { tool_call_id: m.tool_call_id }
                    : {}),
            };
        });

        const newMessages = await prisma.messages.createMany({
            data: fullMessages,
        });
        return newMessages;
    }

    public async getMessages(
        userId: string,
        thread: string,
        take: number
    ): Promise<MessageAI[]> {
        const messages =
            (await prisma.messages.findMany({
                where: {
                    userId: userId,
                    thread: thread,
                },
                orderBy: {
                    id: 'desc',
                },
                take: take,
            })) || [];

        const processedMessages = messages.reverse().map(
            (m) =>
                ({
                    role: m.role as 'system' | 'user' | 'assistant' | 'tool',
                    content: m.content,
                    ...(m.tool_calls
                        ? { tool_calls: JSON.parse(m.tool_calls as string) }
                        : {}),
                    ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
                }) as MessageAI
        );

        // Remove all leading 'tool' messages
        const firstNonToolIndex = processedMessages.findIndex(
            (m) => m.role !== 'tool'
        );
        const resultMessages =
            firstNonToolIndex === -1
                ? []
                : processedMessages.slice(firstNonToolIndex);
        return resultMessages;
    }

    public async getTaskDefinitions(agentId: string) {
        const taskDefinitions = await prisma.taskDefinitions.findMany(
            {
                where: {
                    agentId: agentId
                },
                orderBy: {
                    name: 'asc',
                },
            }
        );
        return taskDefinitions;
    }

    public async getUser(email: string) {
        const user = await prisma.users.findUnique({
            where: {
                email: email,
            },
        });
        return user;
    }

    public async createUser(email: string, password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.users.create({
            data: {
                email: email,
                password: hashedPassword,
            },
        });
        return user;
    }

    //** AgentLayout **//

    public async getAgentByName(name: string) {
        const agent = await prisma.agents.findUnique({
            where: {
                name: name,
            },
        });
        return agent;
    }
}
