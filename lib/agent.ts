import { z } from "zod";

export interface Agent {
    id?: string;
    name: string;
    description: string;
}

export const agentSchema = z.object({
    id: z.string().optional(),
    name: z.string().nonempty("Agent Name is required").regex(/^[a-zA-Z0-9\-]+$/, "Agent Name must be alphanumeric"),
    description: z.string().nonempty("Agent Description is required"),
});