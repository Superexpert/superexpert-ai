import { z } from 'zod';
import { AIModelFactory } from './models/ai-model-factory';

export interface TaskDefinition {
    id?: string;
    agentId: string;
    isSystem: boolean;
    name: string;
    description: string;
    instructions: string;
    serverDataIds: string[];
    serverToolIds: string[];
    clientToolIds: string[];
    modelId: string;
    maximumOutputTokens: number | null;
    temperature: number | null;
}

export const taskDefinitionSchema = z
    .object({
        id: z.string().optional(),
        agentId: z.string().nonempty('Agent ID is required'),
        name: z
            .string()
            .nonempty('Task Name is required')
            .max(20, 'Task Name must be less than 20 characters')
            .regex(
                /^[a-zA-Z0-9\-]+$/,
                'Task Name must contain only letters, numbers, and dashes'
            )
            .transform((val) => val.toLowerCase()),
        description: z.string().nonempty('Task Description is required'),
        instructions: z.string().optional(),
        serverDataIds: z.array(z.string()),
        serverToolIds: z.array(z.string()),
        clientToolIds: z.array(z.string()),
        modelId: z.string().nonempty('Model ID is required'),
        isSystem: z.boolean(),
        maximumOutputTokens: z.coerce
            .number({ message: 'Expected number' })
            .min(1, 'Maximum output tokens must be at least 1')
            .nullable(),
        temperature: z.coerce.number({ message: 'Expected number' }).nullable(),
    })
    .superRefine((data, ctx) => {
        const selectedModel = AIModelFactory.getModelById(data.modelId);
        if (selectedModel && data.maximumOutputTokens !== null) {
            if (data.maximumOutputTokens > selectedModel.maximumOutputTokens) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['maximumOutputTokens'],
                    message: `Maximum output tokens cannot exceed ${selectedModel.maximumOutputTokens.toLocaleString()} for the selected model.`,
                });
            }
        }
    });
