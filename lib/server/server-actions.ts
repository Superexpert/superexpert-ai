'use server';
import { ToolsBuilder } from '@/lib/tools-builder';
import { auth, signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { DBService } from '@/lib/db/db-service';
import { User } from '@/lib/user';

export async function executeServerTool(now: Date, timeZone: string, functionName: string, functionArgs: any) {
    // Get user id
    const session = await auth();
    if (!session || !session.user) {
        throw new Error('User not authenticated');
    }
    const user = session.user as User; 
    user.now = now;
    user.timeZone = timeZone;

    // Execute server tool
    const builder = new ToolsBuilder();
    const result = builder.callServerTool(user, functionName, functionArgs);
    return result;
}


export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
}

export async function register(
    prevState: string | undefined,
    formData: FormData,
  ) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Check for required fields
    if (!email || !password) {
      return 'Please fill in all fields.';
    }

    const db = new DBService();

    // Check if email already registered
    const existingUser = await db.getUser(email);
    if (existingUser) {
      return 'Email already registered.';
    }
    
    // Create user
    try {
      await db.createUser(email, password);
    } catch {
      return 'Something went wrong.';
    }

}


export async function checkAgentName(name:string) {
    const db = new DBService();
    const existingAgent = await db.getAgentByName(name);
    return !!existingAgent;
}