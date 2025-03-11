import { TaskDefinition } from '../task-definition';
import { Agent } from '../agent';
import { prisma } from './prisma';
import { Corpus } from '../corpus';
import { CorpusFile } from '../corpus-file';

export class DBAdminService {
    constructor(protected userId: string) {}

    //** TaskDefinitionForm **//

    public async saveTaskDefinition(data: TaskDefinition) {
        // Update existing
        if (data.id) {
            const existingTaskDefinition =
                await prisma.taskDefinitions.findUnique({
                    where: {
                        id: data.id,
                    },
                });
            if (!existingTaskDefinition) {
                throw new Error('Task Definition not found');
            }

            await prisma.taskDefinitions.update({
                where: {
                    id: data.id,
                },
                data: {
                    name: data.name,
                    description: data.description,
                    instructions: data.instructions,
                    startNewThread: data.startNewThread,
                    serverDataIds: data.serverDataIds,
                    serverToolIds: data.serverToolIds,
                    clientToolIds: data.clientToolIds,
                    modelId: data.modelId,
                    maximumOutputTokens: data.maximumOutputTokens,
                    temperature: data.temperature,
                },
            });

            return existingTaskDefinition;
        }
        // save new
        const newTaskDefinition = await prisma.taskDefinitions.create({
            data: {
                userId: this.userId,
                agentId: data.agentId,
                name: data.name,
                description: data.description,
                instructions: data.instructions,
                startNewThread: data.startNewThread,
                serverToolIds: data.serverToolIds,
                modelId: data.modelId,
                maximumOutputTokens: data.maximumOutputTokens,
                temperature: data.temperature,
            },
        });

        return newTaskDefinition;
    }

    public async getTaskDefinitionById(id: string) {
        const td = await prisma.taskDefinitions.findUnique({
            where: {
                id: id,
            },
        });
        if (!td) {
            throw new Error('Task Definition not found');
        }
        return td;
    }

    public async deleteTaskDefinition(id: string) {
        await prisma.taskDefinitions.delete({
            where: {
                id: id,
            },
        });
        return true;
    }

    //** TaskDefinitionList **//

    public async getTaskDefinitionList(agentId: string) {
        let taskDefinitions = await prisma.taskDefinitions.findMany({
            where: {
                userId: this.userId,
                agentId: agentId,
            },
            select: {
                id: true,
                name: true,
                description: true,
            },
            orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        });

        if (taskDefinitions.length === 0) {
            taskDefinitions = await this.createSystemTaskDefinitions(agentId);
        }

        return taskDefinitions;
    }

    public async createSystemTaskDefinitions(agentId: string) {
        const systemTaskDefinitions = [
            {
                name: 'global',
                description:
                    'Instructions, data, and tools applied to all tasks.',
                instructions: '',
                serverDataIds: [],
                serverToolIds: [],
                clientToolIds: ['transition'],
                modelId: 'gpt-4o',
            },
            {
                name: 'home',
                description:
                    'The first task when a user starts a new conversation.',
                instructions: '',
                serverDataIds: [],
                serverToolIds: [],
                clientToolIds: [],
                modelId: 'global',
            },
        ];

        const results = [];
        for (const taskDefinition of systemTaskDefinitions) {
            const result = await prisma.taskDefinitions.create({
                data: {
                    ...taskDefinition,
                    isSystem: true,
                    userId: this.userId,
                    agentId: agentId,
                },
            });
            results.push(result);
        }
        return results;
    }

    //** AgentListPage **//

    public async getAgentList() {
        const agents = await prisma.agents.findMany({
            where: {
                userId: this.userId,
            },
            orderBy: {
                name: 'asc',
            },
            select: {
                id: true,
                name: true,
                description: true,
            },
        });
        return agents;
    }

    public async getAgentById(id: string) {
        const agent = await prisma.agents.findUnique({
            where: {
                id,
            },
        });
        if (!agent) {
            throw new Error('Agent not found');
        }
        return agent;
    }

    //** AgentForm **//

    public async getAgentByName(name: string) {
        const agent = await prisma.agents.findUnique({
            where: {
                name: name,
            },
        });
        return agent;
    }

    public async saveAgent(data: Agent) {
        // Update existing
        if (data.id) {
            const existingAgent = await prisma.agents.findUnique({
                where: {
                    id: data.id,
                },
            });
            if (!existingAgent) {
                throw new Error('Agent not found');
            }

            await prisma.agents.update({
                where: {
                    id: data.id,
                },
                data: {
                    name: data.name,
                    description: data.description,
                },
            });

            return existingAgent;
        }
        // save new
        const newAgent = await prisma.agents.create({
            data: {
                userId: this.userId,
                name: data.name,
                description: data.description,
            },
        });

        // Create system task definitions
        await this.createSystemTaskDefinitions(newAgent.id);

        return newAgent;
    }

    public async deleteAgent(id: string) {
        await prisma.agents.delete({
            where: {
                id: id,
            },
        });
        return true;
    }

    //** Corpus */


    public async getCorporaList() {
        const corpora = await prisma.corpus.findMany({
            where: {
                userId: this.userId,
            },
            orderBy: {
                name: 'asc',
            },
            select: {
                id: true,
                name: true,
                description: true,
            },
        });
        return corpora;
    }

    public async getCorpusById(id: string) {
        const corpus = await prisma.corpus.findUnique({
            where: {
                id: id,
            },
            include: {
                corpusFiles: true,
            },
        });
        if (!corpus) {
            throw new Error('Corpus not found');
        }
        console.log("db dump");
        console.dir(corpus, { depth: null });

        return corpus;
    }


    public async saveCorpus(corpus: Corpus) {
        // Update existing
        if (corpus.id) {
            const existingCorpus = await prisma.corpus.findUnique({
                where: {
                    id: corpus.id,
                },
            });
            if (!existingCorpus) {
                throw new Error('Corpus not found');
            }

            await prisma.corpus.update({
                where: {
                    id: corpus.id,
                },
                data: {
                    name: corpus.name,
                    description: corpus.description,
                },
            });

            return existingCorpus;
        }
        // save new
        const newCorpus = await prisma.corpus.create({
            data: {
                userId: this.userId,
                name: corpus.name,
                description: corpus.description,
            },
        });

        return newCorpus;
    }

    public async deleteCorpus(id: string) {
        await prisma.corpus.delete({
            where: {
                userId: this.userId,
                id: id,
            },
        });
        return true;
    }


    public async getCorpusByName(name: string) {
        const corpus = await prisma.corpus.findUnique({
            where: {
                userId_name:{
                    userId: this.userId,
                    name,
                }
            },
        });
        return corpus;
    }
    

    public async createCorpusFile(data: CorpusFile) {
        const corpusFile = await prisma.corpusFiles.create({
            data: {
                userId: this.userId,
                corpusId: data.corpusId,
                fileName: data.fileName,
                chunkSize: 1000,
                chunkOverlap: 20,
            },
        });
        return corpusFile.id;
    }

    public async createCorpusFileChunk(
        userId: string,
        corpusFileId: string,
        chunk: string
    ) {
        const corpusFileChunk = await prisma.corpusFileChunks.create({
            data: {
                userId,
                corpusFileId,
                chunk,
            },
        });
        return corpusFileChunk.id;
    }

    public async updateCorpusChunkEmbedding(
        userId: string,
        corpusChunkId: number,
        embedding: number[]
    ) {
        await prisma.$executeRaw`
        UPDATE "superexpert_ai_corpusFileChunks"
        SET embedding = ${embedding}::vector
        WHERE id = ${corpusChunkId} AND "userId" = ${userId};
    `;
    }
}
