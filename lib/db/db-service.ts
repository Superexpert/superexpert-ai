import { MessageAI } from '../message-ai';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { OpenAIEmbeddingAdapter } from '@/lib/adapters/embedding-adapters/openai-embedding-adapter';
import { MAX_MESSAGES, MESSAGE_RETENTION_HOURS } from '@/superexpert.config';

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
                content: m.content || '...',
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

    public async deleteOldMessages() {
        const messageRetentionHours = Number(MESSAGE_RETENTION_HOURS);
        await prisma.messages.deleteMany({
            where: {
                createdAt: {
                    lt: new Date(
                        new Date().getTime() -
                            1000 * 60 * 60 * messageRetentionHours
                    ),
                },
            },
        });
    }

    public async getMessages(
        userId: string,
        thread: string
    ): Promise<MessageAI[]> {
        // Initiate deletion of old messages asynchronously
        // Notice that we DO NOT await this operation because we don't want to block the response
        this.deleteOldMessages().catch((error) => {
            console.error('Error deleting old messages:', error);
        });

        const messages =
            (await prisma.messages.findMany({
                where: {
                    userId: userId,
                    thread: thread,
                },
                orderBy: {
                    id: 'desc',
                },
                take: Number(MAX_MESSAGES),
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
                } as MessageAI)
        );

        // Trim messages from the start until the first message has a role of 'user'
        // This is required for Gemini (uses even/odd messages for assistant/user)
        // And to ensure that a function call does not get cut off in the middle.
        while (
            processedMessages.length > 0 &&
            processedMessages[0].role !== 'user'
        ) {
            processedMessages.shift();
        }

        return processedMessages;
    }

    public async getTaskDefinitions(userId:string, agentId: string) {
        const taskDefinitions = await prisma.taskDefinitions.findMany({
            where: {
                userId: userId,
                agentId: agentId,
            },
            orderBy: {
                name: 'asc',
            },
        });
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

    //** [agentName] page **//

    public async getAgentByName(name: string) {
        const agent = await prisma.agents.findUnique({
            where: {
                name: name,
            },
        });
        return agent;
    }


    //** Corpus */

    public async createCorpora(userId: string, name: string, description: string) {
        const corpora = await prisma.corpora.create({
            data: {
                userId: userId,
                name: name,
                description: description,
            },
        });
        return corpora.id;
    }


    public async createCorpus(userId: string, fileName: string) {
        // TEMP
        const corporaId = await this.createCorpora(userId, 'animals', 'everything about animals');

        const corpus = await prisma.corpus.create({
            data: {
                corporaId: corporaId,
                userId: userId,
                fileName: fileName,
            },
        });
        return corpus.id;
    }


    public async createCorpusChunk(userId:string, corpusId: string, chunk: string) {
        const corpusChunk = await prisma.corpusChunks.create({
            data: {
                userId,
                corpusId,
                chunk,
            },
        });
        return corpusChunk.id;
    }

    public async updateCorpusChunkEmbedding(userId:string, corpusChunkId: number, embedding: number[]) {

        await prisma.$executeRaw`
            UPDATE "superexpert_ai_corpusChunks"
            SET embedding = ${embedding}::vector
            WHERE id = ${corpusChunkId} AND "userId" = ${userId};
        `;
    }

    public async getRelevantCorpusChunks(
        userId: string,
        corpusId: string,
        query: string,
        limit: number = 5
    ) {
        const adapter = new OpenAIEmbeddingAdapter();
        const embedding = await adapter.getEmbedding(query);

        console.log("userId:", userId);
        console.log("corpusId:", corpusId);
        console.log("query:", query);
        console.log("embedding.data[0].embedding:", embedding.data[0].embedding);
        console.log("limit:", limit);

        limit = 100;

        const relevantCorpusChunks = await prisma.$queryRaw`
            SELECT id, chunk
            FROM "superexpert_ai_corpusChunks"
            WHERE "userId" = ${userId} AND "corpusId" = ${corpusId} 
            ORDER BY embedding <=> ${embedding.data[0].embedding}::vector
            LIMIT ${limit};
        `;

        console.log("GOT HERE NOW");

        return relevantCorpusChunks;
    }


}


