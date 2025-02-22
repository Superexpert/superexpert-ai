import { ZodError } from 'zod';

export function collapseErrors(errors: ZodError) {
    const errorMessages = errors.issues.map(issue => issue.message);
    return errorMessages.join(", ");
}