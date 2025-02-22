import { z } from 'zod';

export interface RegisterUser {
    email: string;
    password: string;
}

export const registerUserSchema = z.object({
    email: z
        .string()
        .email('Invalid email address')
        .nonempty('Email is required')
        .transform((val) => val.toLowerCase()),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters')
        .nonempty('Password is required'),
});
