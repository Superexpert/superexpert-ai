'use server';
import { ToolsBuilder } from '@/lib/tools-builder';
import { auth, signIn } from '@/auth';
import { DBService } from '@/lib/db/db-service';
import { User, getUserId } from '@/lib/user';
import { redirect } from 'next/navigation';
import { RegisterUser, registerUserSchema } from '@/lib/register-user';
import { collapseErrors } from '@/lib/validation';
import { ClientTaskDefinition } from '../client/client-task-definition';
import { OpenAIEmbeddingAdapter } from '../adapters/embedding-adapters/openai-embedding-adapter';

export async function executeServerTool(
    now: Date,
    timeZone: string,
    functionName: string,
    functionArgs: any // eslint-disable-line @typescript-eslint/no-explicit-any
) {
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

//** LoginForm **//

export async function authenticateAction(user: RegisterUser) {
    try {
        await signIn('credentials', {
            username: user.email,
            password: user.password,
            redirect: false,
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
    }));
}


export async function createCorpusAction(fileName: string) {
    const userId = await getUserId();
    const db = new DBService();
    const corpusId = await db.createCorpus(userId, fileName);
    return corpusId;
}

export async function uploadChunkAction(corpusId: string, formData: FormData) {
    const userId = await getUserId();

    const chunk = formData.get('chunk') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
    const tokenCount = parseInt(formData.get('tokenCount') as string, 10);
    const fileName = formData.get('fileName') as string;

    console.log("tokenCount:", tokenCount);

    //try {
        const db = new DBService();
        const corpusChunkId = await db.createCorpusChunk(
            userId,
            corpusId,
            chunk
        );

        const adapter = new OpenAIEmbeddingAdapter();
        const embedding = await adapter.getEmbedding(chunk);
        await db.updateCorpusChunkEmbedding(
            userId,
            corpusChunkId,
            embedding.data[0].embedding
        );

        console.log(
            `Successfully saved chunk ${chunkIndex} for file ${fileName}`
        );
    // } catch (error) {
    //     console.error(`Failed to save chunk ${chunkIndex}`, error);
    //     throw new Error(`Failed to save chunk ${chunkIndex}`);
    // }
}
