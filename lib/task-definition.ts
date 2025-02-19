import { z } from "zod";

export interface TaskDefinition {
    id?: number;
    isSystem: boolean;
    name: string;
    description: string;
    instructions: string;
    serverDataIds: string[];
    serverToolIds: string[];
    clientToolIds: string[];
}

export const taskDefinitionSchema = z.object({
    name: z.string().nonempty("Task Name is required"),
    description: z.string().nonempty("Task Description is required"),
    instructions: z.string(),
    serverToolIds: z.array(z.string()),
    isSystem: z.boolean(),
    id: z.number().optional(),
  });