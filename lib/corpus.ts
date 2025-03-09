import { z } from 'zod';

export interface Corpus {
    id?: string;
    fileName: string;
    chunkSize: number;
    overlap: number;
}

export const corpusSchema = z.object({
    id: z.string().optional(),
    fileName: z.string().min(1, 'File Name is required'),
    chunkSize: z
        .number()
        .min(1, 'Chunk Size must be at least 50')
        .max(8192, 'Chunk Size must be at most 8192'),
    overlap: z
        .number()
        .min(0, 'Overlap must be at least 0')
        .max(100, 'Overlap must be at most 100')
        .default(20),
});
