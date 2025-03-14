import { z } from 'zod';

export interface CorpusFile {
    id?: string;
    corpusId: string;
    fileName: string;
    chunkSize: number;
    chunkOverlap: number;
}

export const corpusFileSchema = z.object({
    id: z.string().optional(),
    corpusId: z.string().min(1, 'Corpus ID is required'),
    fileName: z.string().min(1, 'File Name is required'),
    chunkSize: z
        .number()
        .min(1, 'Chunk Size must be at least 50')
        .max(8192, 'Chunk Size must be at most 8192'),
    chunkOverlap: z
        .number()
        .min(0, 'Overlap must be at least 0')
        .max(100, 'Overlap must be at most 100')
        .default(20),
});
