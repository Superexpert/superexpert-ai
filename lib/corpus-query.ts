import { z } from 'zod';


export interface CorpusQuery {
    query: string;
    limit: number;
    similarityThreshold: number;
}

export const corpusQuerySchema = z.object({
    query: z.string().nonempty('Query is required'),
    limit: z.coerce.number().int().min(1).default(3), 
    similarityThreshold: z.coerce.number().min(0).max(100).default(50),
});