import { z } from 'zod';
import { CorpusFile } from './corpus-file';

export interface Corpus {
    id?: string;
    name: string;
    description: string;
    corpusFiles: CorpusFile[];
}

export const corpusSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
});