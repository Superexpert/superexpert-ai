import { z } from 'zod';
import { ragStrategies } from './rag-strategy';


export interface CorpusQuery {
    query: string;
    ragStrategyId: string;
    limit: number;
    similarityThreshold: number;
}

export const corpusQuerySchema = z.object({
    query: z.string().nonempty('Query is required'),
    ragStrategyId: z.string().nonempty('Rag strategy is required'),
    limit: z.coerce.number().int().min(1).default(3), 
    similarityThreshold: z.coerce.number().min(0).max(100).default(50),
});