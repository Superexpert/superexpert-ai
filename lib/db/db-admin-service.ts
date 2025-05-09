import { TaskDefinition } from '../task-definition';
import { Agent } from '../agent';
import { prisma } from './prisma';
import { Corpus } from '../corpus';
import { CorpusFile } from '../corpus-file';
import pgvector from 'pgvector';

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
                    userId: this.userId,
                    ...data,
                },
            });

            return existingTaskDefinition;
        }
        // save new
        const newTaskDefinition = await prisma.taskDefinitions.create({
            data: {
                userId: this.userId,
                ...data,
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

    public async saveAttachment(
        taskDefinitionId: string,
        fileName: string,
        file: string
    ) {
        const newAttachment = await prisma.attachments.create({
            data: {
                userId: this.userId,
                taskDefinitionId,
                fileName,
                file,
            },
            select: {
                id: true,
            },
        });

        return newAttachment.id;
    }

    public async deleteAttachment(attachmentId: string) {
        await prisma.attachments.delete({
            where: {
                userId: this.userId,
                id: attachmentId,
            },
        });
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
                contextToolIds: [],
                serverToolIds: [],
                clientToolIds: ['transition'],
                modelId: 'gpt-4o',
                theme: 'default',
            },
            {
                name: 'home',
                description:
                    'The first task when a user starts a new conversation.',
                instructions: '',
                contextToolIds: [],
                serverToolIds: [],
                clientToolIds: [],
                modelId: 'global',
                theme: 'global',
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

    public async deleteCorpusFile(corpusId:string, corpusFileId: string) {
        await prisma.corpusFiles.delete({
            where: {
                userId: this.userId,
                id: corpusFileId,
            },
        });

        await prisma.$transaction([
            prisma.$executeRaw`
              DELETE FROM "superexpert_ai_corpusTermFrequencies"
              WHERE  "corpusId" = ${corpusId};
            `,
            prisma.$executeRaw`
              INSERT INTO "superexpert_ai_corpusTermFrequencies"( "corpusId", lexeme, ndoc, nentry )
              SELECT  ${corpusId}, word, ndoc, nentry
              FROM    ts_stat($$SELECT cfc."chunkTSV"
                               FROM   "superexpert_ai_corpusFileChunks"  cfc
                               JOIN   "superexpert_ai_corpusFiles"       cf
                                      ON cfc."corpusFileId" = cf.id
                               WHERE  cf."corpusId" = '${corpusId}'  $$);
            `
          ]);

        return true;
    }

    public async getCorpusByName(name: string) {
        const corpus = await prisma.corpus.findUnique({
            where: {
                userId_name: {
                    userId: this.userId,
                    name,
                },
            },
        });
        return corpus;
    }

    public async createCorpusFile(data: CorpusFile) {
        const corpusFile = await prisma.corpusFiles.upsert({
            where: {
                corpusId_fileName: {
                    corpusId: data.corpusId,
                    fileName: data.fileName,
                },
            }, // @@unique
            create: {
                userId: this.userId,
                corpusId: data.corpusId,
                fileName: data.fileName,
                chunkSize: data.chunkSize,
                chunkOverlap: data.chunkOverlap,
            },
            update: {
                chunkSize: data.chunkSize,
                chunkOverlap: data.chunkOverlap,
                done: data.done,
            },
            select: { id: true },
        });
        return corpusFile.id;
    }

    public async markCorpusFileDone(corpusId: string, corpusFileId: string) {
        // Generate tsvector for full-text search
        await prisma.$executeRaw`
            UPDATE "superexpert_ai_corpusFileChunks"
            SET    "chunkTSV" = to_tsvector('english', "chunk");
        `;

        // Generate term frequencies for the corpus
        await prisma.$executeRaw`
            INSERT INTO "superexpert_ai_corpusTermFrequencies" ( "corpusId", lexeme, ndoc, nentry )
            SELECT  ${corpusId},                       -- ← value bound once
                    word,
                    ndoc,
                    nentry
            FROM    ts_stat(
                    /* build the text that ts_stat expects */
                    format(
                        $$SELECT cfc."chunkTSV"
                            FROM "superexpert_ai_corpusFileChunks"  cfc
                            JOIN "superexpert_ai_corpusFiles"       cf
                                ON cfc."corpusFileId" = cf.id
                        WHERE cf."corpusId" = %L$$,             -- %L = literal-escaped
                        ${corpusId}                                -- ← inserted into %L
                    )
                    )
            ON CONFLICT ( "corpusId", lexeme )
            DO UPDATE SET ndoc   = EXCLUDED.ndoc,
                        nentry = EXCLUDED.nentry;
        `;

        // Update the corpus file to mark it as done
        await prisma.corpusFiles.update({
            where: {
               id:corpusFileId,
               userId: this.userId,
            },
            data: {
                done: true,
            },
        });


        return true;
    }

    public async createCorpusFileChunk(
        userId       : string,
        corpusFileId : string,
        chunkIndex   : number,
        chunkText    : string,
        embedding    : number[]
      ) {
        const vec = pgvector.toSql(embedding);   
      
        await prisma.$transaction(async (tx) => {
          /* 1️⃣  insert chunk, skip if already present */
          await tx.$executeRawUnsafe(
            `INSERT INTO "superexpert_ai_corpusFileChunks"
               ("userId","corpusFileId","chunkIndex","chunk","embedding")
             VALUES ($1,$2,$3,$4,$5::vector)
             ON CONFLICT ("corpusFileId","chunkIndex") DO NOTHING`,
            userId,
            corpusFileId,
            chunkIndex,
            chunkText,
            vec
          );
      
          /* 2️⃣  bump checkpoint monotonically */
          await tx.$executeRawUnsafe(
            `INSERT INTO "superexpert_ai_corpusFileProgress"
                     ("corpusFileId","lastChunk")
             VALUES ($1,$2)
             ON CONFLICT ("corpusFileId")
             DO UPDATE SET "lastChunk" = GREATEST(
                 EXCLUDED."lastChunk",
                 "superexpert_ai_corpusFileProgress"."lastChunk"
             )`,
            corpusFileId,
            chunkIndex
          );
        });
      }

    // public async updateCorpusChunkEmbedding(
    //     userId: string,
    //     corpusChunkId: number,
    //     embedding: number[]
    // ) {
    //     await prisma.$executeRaw`
    //     UPDATE "superexpert_ai_corpusFileChunks"
    //     SET embedding = ${embedding}::vector
    //     WHERE id = ${corpusChunkId} AND "userId" = ${userId};
    // `;
    // }

    public async getCorpusFileProgress(corpusFileId: string) {
        const row = await prisma.corpusFileProgress.findUnique({
            where: { corpusFileId },
            select: { lastChunk: true },
          });
          return row?.lastChunk ?? -1;    
    }
      
}
