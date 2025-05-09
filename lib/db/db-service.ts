import { MessageAI } from '@superexpert-ai/framework';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { MAX_MESSAGES, MESSAGE_RETENTION_HOURS } from '@/superexpert-ai.config';
import { CorpusQueryResult } from '../corpus-query-result';
import { Prisma } from '@prisma/client';
import { removeStopwords } from 'stopword';
import { Tsquery } from 'pg-tsquery';

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

    public async getTaskDefinitions(userId: string, agentId: string) {
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

    public async queryCorpusSemantic(
        userId: string,
        corpusIds: string[],
        embedding: number[],
        limit: number,
        similarityThreshold: number
    ): Promise<CorpusQueryResult[]> {
        // Convert similarity threshold to a value between 0 and 1
        const decimalSimilarityThreshold = similarityThreshold / 100;
        const uniqueCorpusIds = [...new Set(corpusIds)];

        const relevantCorpusChunks = (await prisma.$queryRaw`
            SELECT cfc.id, cfc.chunk, cf."fileName",
            (1 - (cfc.embedding <=> ${embedding}::vector)) AS similarity
            FROM "superexpert_ai_corpusFileChunks" AS cfc
            INNER JOIN "superexpert_ai_corpusFiles" AS cf
            ON cfc."corpusFileId" = cf.id
            WHERE cf."corpusId" IN (${uniqueCorpusIds.join(',')})
            AND cfc."userId" = ${userId}
            AND (1 - (cfc.embedding <=> ${embedding}::vector)) >= ${decimalSimilarityThreshold}
            ORDER BY cfc.embedding <=> ${embedding}::vector
            LIMIT ${limit};
            `) as {
            id: number;
            chunk: string;
            fileName: string;
            similarity: number;
        }[];

        return relevantCorpusChunks;
    }

    /**
     * Build:   anchor & (token2 | token3 | …)
     * Rarest (lowest ndoc across the selected corpora) becomes the anchor.
     */
    //type BuiltQuery = { sql: Prisma.Sql, tokens: string[] };

    async buildKeywordQuery(raw: string, corpusIds: string[]): Promise<{ sql: Prisma.Sql, tokens: string[] }> {
           
            /* 1️⃣  tokenise -------------------------------------------------------- */
            const tokens = removeStopwords(
              raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
            );
            if (!tokens.length) return { sql: Prisma.sql`''::tsquery`, tokens: [] };
          
            /* 2️⃣  get Σ-document-frequency for each token ------------------------ */
            const freqs = await prisma.corpusTermFrequencies.groupBy({
              by: ['lexeme'],
              where: { corpusId: { in: corpusIds }, lexeme: { in: tokens } },
              _sum: { ndoc: true },
            });
            const ndoc = Object.fromEntries(
              freqs.map(f => [f.lexeme, f._sum!.ndoc ?? 0])
            );
          
            /* 3️⃣  pick rarest token as anchor ------------------------------------ */
            tokens.sort(
              (a, b) => (ndoc[a] ?? 1e9) - (ndoc[b] ?? 1e9) || b.length - a.length
            );
            const anchor = tokens.shift()!;          // rarest
            const rest   = tokens;                   // remaining tokens
          
            /* 4️⃣  build Boolean expression --------------------------------------- */
            let expr: string;
            if (rest.length === 0) {
              expr = anchor;                                         // e.g. bertha
            } else if (rest.length === 1) {
              expr = `${anchor} | ${rest[0]}`;                       // bertha | old
            } else {
              expr = `${anchor} (${rest.join(',')})`;                // icard (cabin,miss)
            }
          
            const tsText = new Tsquery().parseAndStringify(expr);    // commas ⇒ OR, space ⇒ AND
            return {
              sql: Prisma.sql`to_tsquery('english', ${tsText})`,
              tokens: [anchor, ...rest],                             // for coverage count
            };
          }

    public async queryCorpusKeyword(
        userId: string,
        corpusIds: string[],
        query: string,
        limit: number,
        similarityThreshold = 0
    ): Promise<CorpusQueryResult[]> {
        const uniqueCorpusIds = [...new Set(corpusIds)];
        const idsSql = Prisma.join(uniqueCorpusIds); // <- each uuid its own bind param

        const { sql: tsQuery, tokens } = await this.buildKeywordQuery(query, corpusIds);

        console.log('query', query);
        console.log('tsQuery', tsQuery);

        const rows = await prisma.$queryRaw<{
        id: number; chunk: string; fileName: string; hits: number; rank: number;
        }[]>`
            WITH q_terms AS (
            SELECT ${tokens}::text[] AS arr            -- ← array literal passed by Prisma
            )
            SELECT  cfc.id,
                    cfc.chunk,
                    (
                    SELECT COUNT(*)                    -- hits = coverage
                    FROM (
                        SELECT unnest((SELECT arr FROM q_terms))
                        INTERSECT
                        SELECT unnest(tsvector_to_array(cfc."chunkTSV"))
                    ) AS x
                    )                       AS hits,
                    ts_rank_cd(cfc."chunkTSV", ${tsQuery}, 4|8) AS rank
            FROM    "superexpert_ai_corpusFileChunks" AS cfc
            JOIN    "superexpert_ai_corpusFiles"      AS cf
                ON cfc."corpusFileId" = cf.id
            WHERE   cf."corpusId" IN (${Prisma.join(corpusIds)})
            AND   cfc."userId"  = ${userId}
            AND   cfc."chunkTSV" @@ ${tsQuery}
            ORDER  BY hits DESC, rank DESC
            LIMIT  ${limit};
        `;

        console.log('rows', rows);

        const max = Math.max(0, ...rows.map((r) => r.rank));
        return rows.map((r) => ({ ...r, similarity: max ? r.rank / max : 0 }));
    }

    public async getCorporaList(userId: string) {
        const corpora = await prisma.corpus.findMany({
            where: {
                userId: userId,
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

    // gets ids and filenames for attachments associated with a task
    public async getAttachmentList(userId: string, taskDefinitionId: string) {
        const attachmentList = await prisma.attachments.findMany({
            where: {
                userId,
                taskDefinitionId,
            },
            orderBy: {
                fileName: 'asc',
            },
            select: {
                id: true,
                fileName: true,
                createdAt: true,
            },
        });
        return attachmentList;
    }

    public async getFullAttachments(
        userId: string,
        taskDefinitionIds: string[]
    ) {
        const attachments = await prisma.attachments.findMany({
            where: {
                userId,
                taskDefinitionId: {
                    in: taskDefinitionIds,
                },
            },
            select: {
                id: true,
                fileName: true,
                file: true,
                createdAt: true,
            },
        });
        return attachments;
    }
}
