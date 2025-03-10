import { z } from 'zod';


export interface Corpus {
    id?: string;
    name: string;
    description: string;
}

export const corpusSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
});