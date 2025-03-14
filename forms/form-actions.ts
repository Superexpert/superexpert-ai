'use server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function saveConsentAction(type: string) {
    // Get user id
    const session = await auth();
    if (!session || !session.user?.id) {
        throw new Error('User not authenticated');
    }

    // Save consent
    const consent = await prisma.consents.create({
        data: {
            userId: session.user.id,
            type: type,
        },
    });
    return consent;
}
