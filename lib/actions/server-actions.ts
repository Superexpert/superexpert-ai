'use server';
import { auth, signIn } from '@/auth';
import { DBService } from '@/lib/db/db-service';
import { ClientTaskDefinition, callServerTool, ServerToolContext } from '@superexpert-ai/framework';
import { redirect } from 'next/navigation';
import { RegisterUser, registerUserSchema } from '@/lib/register-user';
import { collapseErrors } from '@/lib/validation';
import { getUserId } from '../user';
import { prisma } from '@/lib/db/prisma';

export async function executeServerTool(
    agentId: string,
    agentName: string,
    now: Date,
    timeZone: string,
    functionName: string,
    functionArgs: any, // eslint-disable-line @typescript-eslint/no-explicit-any
) {
    // Get user id
    const session = await auth();
    if (!session || !session.user) {
        throw new Error('User not authenticated');
    }
    const user = session.user;

    // Execute server tool
    const context: ServerToolContext = {
        user: {
            id: user.id!,
            now: now,
            timeZone: timeZone,
        },
        agent: {
            id: agentId,
            name: agentName,
        },
        db: prisma
    };

    console.log('functionArgs');
    console.dir(functionArgs, { depth: null });
    const result = callServerTool(functionName, context, functionArgs);
    return result;
}

//** LoginForm **//

export async function authenticateAction(user: RegisterUser) {
    try {
        await signIn('credentials', {
            username: user.email,
            password: user.password,
            redirect: false,
            //redirectTo: '/',
        });
        return {
            success: true,
            serverError: '',
        };
    } catch {
        return {
            success: false,
            serverError: 'Wrong username or password',
        };
    }
}

export async function registerAction(user: RegisterUser) {
    // Validate using Zod
    const result = registerUserSchema.safeParse(user);
    if (!result.success) {
        return {
            success: false,
            serverError: collapseErrors(result.error),
        };
    }

    const db = new DBService();

    // Check if email already registered
    const existingUser = await db.getUser(user.email);
    if (existingUser) {
        return {
            success: false,
            serverError: 'Email already registered.',
        };
    }

    // Create user
    try {
        await db.createUser(user.email, user.password);
    } catch {
        return {
            success: false,
            serverError: 'Something went wrong.',
        };
    }

    // Sign in user
    await signIn('credentials', {
        username: user.email,
        password: user.password,
        redirect: false,
    });

    return {
        success: true,
        serverError: '',
    };
}

export async function getAgentAction(resolvedParams: {
    [key: string]: string;
}) {
    const { agentName } = resolvedParams;
    const db = new DBService();
    const existingAgent = await db.getAgentByName(agentName);
    if (!existingAgent) {
        //return notFound();
        return redirect('/not-found');
    }
    return existingAgent;
}

export async function getTasksAction(
    agentId: string
): Promise<ClientTaskDefinition[]> {
    const userId = await getUserId();

    const db = new DBService();
    const tasks = await db.getTaskDefinitions(userId, agentId);
    return tasks.map((task) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        isSystem: task.isSystem,
        startNewThread: task.startNewThread,
        modelId: task.modelId,
        theme: task.theme,
    }));
}




