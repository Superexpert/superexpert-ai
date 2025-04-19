'use server';
import { TaskDefinition, serverTaskDefinitionSchema } from '@/lib/task-definition';
import { DBAdminService } from '@/lib/db/db-admin-service';
import { DBService } from '@/lib/db/db-service';
import { redirect } from 'next/navigation';
import { getUserId } from '@/lib/user';
import { Agent, agentSchema } from '@/lib/agent';
import { collapseErrors } from '@/lib/validation';
import { OpenAIEmbeddingAdapter } from '../adapters/embedding-adapters/openai-embedding-adapter';
import { Corpus, corpusSchema } from '@/lib/corpus';
import { CorpusFile, corpusFileSchema } from '@/lib/corpus-file';
import { CorpusQuery} from '@/lib/corpus-query';
import { getLLMDefinitions, getServerToolList, getContextToolList, getClientToolList } from '@superexpert-ai/framework';

//** TaskDefinitionForm **//

export async function getTaskDefinitionFormDataAction(taskId?: string) {
    const userId = await getUserId();

    const db = new DBService();

    let attachments: { id: string; fileName: string }[] = [];
    if (taskId) {
        attachments = await db.getAttachmentList(userId, taskId);
    }

    const corpora = await db.getCorporaList(userId);

    const contextTools = getContextToolList();
    const serverTools = getServerToolList();
    const clientTools = getClientToolList();
    const llmModels = getLLMDefinitions();

    return {
        attachments,
        corpora,
        contextTools,
        serverTools,
        clientTools,
        llmModels,
    };
}

export async function saveTaskDefinitionAction(taskDefinition: TaskDefinition) {
    const userId = await getUserId();

    // Validate using Zod
    const result = serverTaskDefinitionSchema.safeParse(taskDefinition);
    if (!result.success) {
        return {
            success: false,
            serverError: collapseErrors(result.error),
        };
    }

    try {
        const db = new DBAdminService(userId);
        await db.saveTaskDefinition(taskDefinition);
    } catch {
        return {
            success: false,
            serverError: 'Failed to save task definition',
        };
    }

    return {
        success: result.success,
        serverError: '',
    };
}

export async function deleteTaskDefinitionAction(id: string) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    await db.deleteTaskDefinition(id);
    redirect('/admin');
}

export async function getTaskDefinitionByIdAction(id: string) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    const result = await db.getTaskDefinitionById(id);
    return result;
}

//** TaskListPage **//

export async function getTaskDefinitionListAction(agentId: string) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    const result = await db.getTaskDefinitionList(agentId);
    return result;
}

//** AgentListPage **//

export async function getAgentListAction() {
    const userId = await getUserId();

    // Get agents
    const db = new DBAdminService(userId);
    const result = await db.getAgentList();
    return result;
}

export async function getAgentByIdAction(id: string) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    const result = await db.getAgentById(id);
    return result;
}

//** AgentForm **//

export async function saveAgentAction(
    newAgent: Agent
): Promise<{ success: boolean; serverError: string }> {
    const userId = await getUserId();

    // Validate using Zod
    const result = agentSchema.safeParse(newAgent);
    if (!result.success) {
        return {
            success: false,
            serverError: collapseErrors(result.error),
        };
    }

    // Check agent name uniqueness
    const db = new DBAdminService(userId);
    const existingAgent = await db.getAgentByName(newAgent.name);
    if (existingAgent && existingAgent.id !== newAgent.id) {
        return {
            success: false,
            serverError: 'Agent name must be unique',
        };
    }

    try {
        const db = new DBAdminService(userId);
        await db.saveAgent(newAgent);
        return {
            success: true,
            serverError: '',
        };
    } catch (error) {
        console.error('Error saving agent:', error);
        return {
            success: false,
            serverError: 'Failed to save agent.',
        };
    }
}

export async function deleteAgentAction(id: string) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    await db.deleteAgent(id);
    redirect('/');
}

/* Corpus */

export async function getCorporaListAction() {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    const result = await db.getCorporaList();
    return result;
}

export async function getCorpusByIdAction(id: string) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    const result = await db.getCorpusById(id);
    return result;
}

export async function saveCorpusFileAction(
    newCorpusFile: CorpusFile
): Promise<{ success: boolean; serverError: string; corpusFileId?: string }> {
    const userId = await getUserId();

    // Validate using Zod
    const result = corpusFileSchema.safeParse(newCorpusFile);
    if (!result.success) {
        return {
            success: false,
            serverError: collapseErrors(result.error),
        };
    }

    const db = new DBAdminService(userId);

    try {
        const corpusFileId = await db.createCorpusFile(newCorpusFile);
        return {
            success: true,
            serverError: '',
            corpusFileId: corpusFileId,
        };
    } catch (error) {
        console.error('Error saving corpus:', error);
        return {
            success: false,
            serverError: 'Failed to save corpus.',
        };
    }
}

export async function uploadChunkAction(
    corpusFileId: string,
    formData: FormData
) {
    const userId = await getUserId();

    const chunk = formData.get('chunk') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
    const tokenCount = parseInt(formData.get('tokenCount') as string, 10);
    const fileName = formData.get('fileName') as string;

    try {
        const db = new DBAdminService(userId);
        const corpusChunkId = await db.createCorpusFileChunk(
            userId,
            corpusFileId,
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
            `Successfully saved chunk ${chunkIndex} for file ${fileName} using ${tokenCount} tokens`
        );
    } catch (error) {
        console.error(`Failed to save chunk ${chunkIndex}`, error);
        throw new Error(`Failed to save chunk ${chunkIndex}`);
    }
}

/* Edit Corpus Form */

export async function saveCorpusAction(
    newCorpus: Corpus
): Promise<{ success: boolean; serverError: string }> {
    const userId = await getUserId();

    // Validate using Zod
    const result = corpusSchema.safeParse(newCorpus);
    if (!result.success) {
        return {
            success: false,
            serverError: collapseErrors(result.error),
        };
    }

    // Check corpus name uniqueness
    const db = new DBAdminService(userId);
    const existingCorpus = await db.getCorpusByName(newCorpus.name);
    if (existingCorpus && existingCorpus.id !== newCorpus.id) {
        return {
            success: false,
            serverError: 'Corpus name must be unique',
        };
    }

    try {
        await db.saveCorpus(newCorpus);
        return {
            success: true,
            serverError: '',
        };
    } catch (error) {
        console.error('Error saving corpus:', error);
        return {
            success: false,
            serverError: 'Failed to save corpus.',
        };
    }
}

export async function deleteCorpusAction(id: string) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    await db.deleteCorpus(id);
    redirect('/admin/corpora');
}

export async function deleteCorpusFileAction(corpusFileId: string) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    await db.deleteCorpusFile(corpusFileId);
}

export async function queryCorpusAction(corpusId: string, corpusQuery: CorpusQuery) {
    const userId = await getUserId();

    // Call DBService instead of AdminService because we want the real experience
    const db = new DBService();
    const result = await db.queryCorpus(
        userId,
        [corpusId],
        corpusQuery.query,
        corpusQuery.limit,
        corpusQuery.similarityThreshold
    );
    return result;
}

export async function saveAttachmentAction(
    taskDefinitionId: string,
    fileName: string,
    file: string
) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    const attachmentId = await db.saveAttachment(
        taskDefinitionId,
        fileName,
        file
    );
    return attachmentId;
}

export async function deleteAttachmentAction(attachmentId: string) {
    const userId = await getUserId();

    const db = new DBAdminService(userId);
    await db.deleteAttachment(attachmentId);
}
