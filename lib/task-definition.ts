import { z } from 'zod';
import { AIModelFactory } from './models/ai-model-factory';

export interface TaskDefinition {
    id?: string;
    agentId: string;
    isSystem: boolean;
    name: string;
    description: string;
    instructions: string;
    startNewThread: boolean;
    corpusLimit: number;
    corpusIds: string[];
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
        startNewThread: z.boolean(),
        corpusLimit: z.number().min(0).max(50).default(1),
        corpusIds: z.array(z.string()),
        serverDataIds: z.array(z.string()),
        serverToolIds: z.array(z.string()),
        clientToolIds: z.array(z.string()),
        modelId: z.string().nonempty('Model ID is required'),
        isSystem: z.boolean(),


        maximumOutputTokens: z.coerce.number().min(1).nullable(),
      

        temperature:     z.coerce.number().min(0).nullable(),
  
    })
    .superRefine((data, ctx) => {
        const selectedModel = AIModelFactory.getModelById(data.modelId);
        if (!selectedModel) {
            data.maximumOutputTokens = null;
            data.temperature = null;
        } else {
            if (data.maximumOutputTokens) {
                if (data.maximumOutputTokens > selectedModel.maximumOutputTokens) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['maximumOutputTokens'],
                        message: `Maximum output tokens cannot exceed ${selectedModel.maximumOutputTokens.toLocaleString()} for the selected model.`,
                    });
                }
            }
            if (data.temperature) {
                if (data.temperature > selectedModel.maximumTemperature) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['temperature'],
                        message: `Temperature cannot exceed ${selectedModel.maximumTemperature.toLocaleString()} for the selected model.`,
                    });
                }
            }
        }
    });
