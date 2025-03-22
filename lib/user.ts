import { auth } from '@/auth';



export async function getUserId(): Promise<string> {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error('User not authenticated');
    }
    return session.user.id as string;
}
