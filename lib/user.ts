import { auth } from "@/auth";



export interface User {
    id: string;
    timeZone: string;
    now: Date;
}

export async function getUserId(): Promise<string> {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error('User not authenticated');
    }
    return session.user.id as string;   
}