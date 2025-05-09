import { OpenAIEmbeddingAdapter } from '@/lib/adapters/embedding-adapters/openai-embedding-adapter';
import { CorpusQueryResult } from './corpus-query-result';
import { DBService } from './db/db-service'; 

export const ragStrategies = [
    {
        id: 'semantic',
        name: 'Semantic Search',
        description: 'Uses semantic search to find relevant documents based on meaning.',
    },
    {
        id: 'keyword',
        name: 'Keyword Search',
        description: 'Uses keyword search to find relevant documents based on exact matches.',
    },
    {
        id: 'fusion',
        name: 'Fusion Search',
        description: 'Combines semantic and keyword search for better results.',
    },
] as const;



async function queryCorpusSemantic(
    db: DBService,
    userId: string,
    corpusIds: string[],
    query: string,
    limit: number,
    similarityThreshold: number
): Promise<CorpusQueryResult[]> {
    const adapter = new OpenAIEmbeddingAdapter();
    const embedding = await adapter.getEmbedding(query);
    const relevantCorpusChunks = await db.queryCorpusSemantic(userId, corpusIds, embedding, limit, similarityThreshold);
    return relevantCorpusChunks;
}

async function queryCorpusKeyword(
    db: DBService,
    userId: string,
    corpusIds: string[],
    query: string,
    limit: number,
): Promise<CorpusQueryResult[]> {
    const relevantCorpusChunks = await db.queryCorpusKeyword(userId, corpusIds, query, limit);
    return relevantCorpusChunks;
}


export async function queryCorpus(
    userId: string,
    corpusIds: string[],
    ragStrategyId: string,
    query: string,
    limit: number,
    similarityThreshold: number
): Promise<CorpusQueryResult[]> {
    const db = new DBService();

    if (ragStrategyId == 'semantic') {
        const relevantSemanticChunks = await queryCorpusSemantic(db, userId, corpusIds, query, limit, similarityThreshold);
        return relevantSemanticChunks;
    }
    
    if (ragStrategyId === 'keyword') {
        const relevantKeywordChunks = await queryCorpusKeyword(db, userId, corpusIds, query, limit);
        return relevantKeywordChunks;
    }

    if (ragStrategyId === 'fusion') {
        const relevantSemanticChunks = await queryCorpusSemantic(db, userId, corpusIds, query, limit, similarityThreshold);
        const relevantKeywordChunks = await queryCorpusKeyword(db, userId, corpusIds, query, limit);
        // Merge the results from semantic and keyword queries
        const mergedResults = [...relevantSemanticChunks, ...relevantKeywordChunks];
        return mergedResults;
    }

    throw new Error('Invalid RAG strategy. Please use "semantic", "keyword", or "fusion".');
}

