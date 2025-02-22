import { z } from "zod";

export interface Agent {
    id?: string;
    name: string;
    description: string;
}

export const agentSchema = z.object({
    id: z.string().optional(),
    name: z.string()
        .nonempty("Required")
        .max(20, "Agent Name must be less than 20 characters")
        .regex(/^[a-zA-Z0-9\-]+$/, "Agent Name must contain only letters, numbers, and dashes")
        .transform(val => val.toLowerCase()),
    description: z.string()
        .max(500, "Agent Description must be less than 500 characters")
        .nonempty("Required"),
});