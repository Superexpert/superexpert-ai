
import { registerRAGStrategy, CorpusQueryResult } from '@superexpert-ai/framework';
import { OpenAIEmbeddingAdapter } from '@/lib/adapters/embedding-adapters/openai-embedding-adapter';

registerRAGStrategy({
    id: 'semantic',
    name: 'Semantic Search',
    category: 'system',
    description: 'Uses semantic search to find relevant documents based on meaning.',
    function: async function(): Promise<CorpusQueryResult[]> {
        const adapter = new OpenAIEmbeddingAdapter();
        const embedding = await adapter.getEmbedding(this.query);

        // Convert similarity threshold to a value between 0 and 1
        const decimalSimilarityThreshold = this.similarityThreshold / 100;

        const relevantCorpusChunks = (await this.db.$queryRaw`
            SELECT cfc.id, cfc.chunk, cf."fileName",
            (1 - (cfc.embedding <=> ${embedding}::vector)) AS similarity
            FROM "superexpert_ai_corpusFileChunks" AS cfc
            INNER JOIN "superexpert_ai_corpusFiles" AS cf
            ON cfc."corpusFileId" = cf.id
            WHERE cf."corpusId" IN (${this.corpusIds.join(',')})
            AND cfc."userId" = ${this.userId}
            AND (1 - (cfc.embedding <=> ${embedding}::vector)) >= ${decimalSimilarityThreshold}
            ORDER BY cfc.embedding <=> ${embedding}::vector
            LIMIT ${this.limit};
            `) as {
            id: number;
            chunk: string;
            fileName: string;
            similarity: number;
        }[];

        return relevantCorpusChunks;
    },
});


