import { z } from "zod";

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
}

export const taskDefinitionSchema = z.object({
    id: z.string().optional(),
    agentId: z.string().nonempty("Agent ID is required"),
    name: z.string().nonempty("Task Name is required"),
    description: z.string().nonempty("Task Description is required"),
    instructions: z.string().optional(),
    serverDataIds: z.array(z.string()),
    serverToolIds: z.array(z.string()),
    clientToolIds: z.array(z.string()),
    isSystem: z.boolean(),
});