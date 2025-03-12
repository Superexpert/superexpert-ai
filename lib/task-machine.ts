import { DBService } from '@/lib/db/db-service';
import { MessageAI } from '@/lib/message';
import { TaskDefinition } from './task-definition';
import { ToolAI } from '@/lib/tool-ai';
import { ToolsBuilder } from './tools-builder';
import { User } from '@/lib/user';
import { ModelConfiguration } from './model-configuration';

export class TaskMachine {
    private db: DBService;

    constructor() {
        this.db = new DBService();
    }

    public async getAIPayload(
        user: User,
        agentId: string,
        task: string,
        thread: string,
        messages: MessageAI[]
    ): Promise<{
        instructions: string;
        currentMessages: MessageAI[];
        tools: ToolAI[];
        modelId: string;
        modelConfiguration: ModelConfiguration;
    }> {
        // Get task definition
        const taskDefinitions = await this.getTaskDefinitions(user.id, agentId);
        let taskDefinition = taskDefinitions.find((td) => td.name === task);

        // default task to home if not found
        if (!taskDefinition) {
            task = 'home';
            taskDefinition = taskDefinitions.find((td) => td.name === task);
        }
        if (!taskDefinition) {
            throw new Error(`Task definition not found for task: ${task}`);
        }

        const globalTaskDefinition = taskDefinitions.find(
            (td) => td.name === 'global'
        );
        if (!globalTaskDefinition) {
            throw new Error(`Task definition not found for task: global`);
        }

        // get modelId
        const modelId =
            taskDefinition.modelId === 'global'
                ? globalTaskDefinition.modelId
                : taskDefinition.modelId;

        // get model configuration
        const modelConfiguration = this.getModelConfiguration(
            taskDefinition,
            globalTaskDefinition
        );

        await this.augmentMessages(user.id, taskDefinition, messages);

        // Save messages
        await this.saveMessages(user.id, agentId, task, thread, messages);

        // Get previous messages
        const previousMessages = await this.getPreviousMessages(
            user.id,
            thread
        );

        // Get instructions
        const instructions = await this.getInstructions(
            user,
            taskDefinition,
            globalTaskDefinition
        );

        // Get tools
        const tools = await this.getTools(taskDefinition, globalTaskDefinition);

        return {
            instructions,
            currentMessages: previousMessages,
            tools,
            modelId,
            modelConfiguration,
        };
    }

    private getModelConfiguration(
        taskDefinition: TaskDefinition,
        globalTaskDefinition: TaskDefinition
    ): ModelConfiguration {
        return {
            maximumOutputTokens:
                taskDefinition.maximumOutputTokens ||
                globalTaskDefinition.maximumOutputTokens,
            temperature:
                taskDefinition.temperature || globalTaskDefinition.temperature,
        };
    }

    private async getTools(
        taskDefinition: TaskDefinition,
        globalTaskDefinition: TaskDefinition
    ): Promise<ToolAI[]> {
        // merge server, client, task, and global tool ids
        const toolIds: string[] = [
            ...new Set([
                ...taskDefinition.serverToolIds,
                ...taskDefinition.clientToolIds,
                ...globalTaskDefinition.serverToolIds,
                ...globalTaskDefinition.clientToolIds,
            ]),
        ];
        const builder = new ToolsBuilder();
        const tools = await builder.getTools(toolIds);
        return tools;
    }

    private async getServerData(
        user: User,
        taskDefinition: TaskDefinition,
        globalTaskDefinition: TaskDefinition
    ): Promise<string> {
        // merge server data ids
        const serverDataIds: string[] = [
            ...new Set([
                ...taskDefinition.serverDataIds,
                ...globalTaskDefinition.serverDataIds,
            ]),
        ];
        let result = '';
        const builder = new ToolsBuilder();
        for (const serverDataId of serverDataIds) {
            const serverData = await builder.callServerData(user, serverDataId);
            result += `${serverData}\n`;
        }
        return result;
    }

    private async getInstructions(
        user: User,
        taskDefinition: TaskDefinition,
        globalTaskDefinition: TaskDefinition
    ): Promise<string> {
        const serverData = await this.getServerData(
            user,
            taskDefinition,
            globalTaskDefinition
        );

        const attachments = await this.db.getFullAttachments(
            user.id,
            taskDefinition.id!
        );
        const attachmentsBlob =
            `\n\nRetrieved information:\n` +
            attachments
                .map(
                    (attachment) => `
File Name: ${attachment.fileName}
\nFile:\n ${attachment.file} 
\nCreatedAt: ${attachment.createdAt}
`
                )
                .join('\n\n');

        return (
            globalTaskDefinition.instructions +
            taskDefinition.instructions +
            serverData +
            attachmentsBlob
        );
    }

    private async getTaskDefinitions(userId: string, agentId: string) {
        const result = await this.db.getTaskDefinitions(userId, agentId);
        return result;
    }

    public async saveMessages(
        userId: string,
        agentId: string,
        task: string,
        thread: string,
        messages: MessageAI[]
    ) {
        await this.db.saveMessages(userId, agentId, task, thread, messages);
    }

    private async getPreviousMessages(userId: string, thread: string) {
        const result = await this.db.getMessages(userId, thread);
        return result;
    }

    private async augmentMessages(
        userId: string,
        taskDefinition: TaskDefinition,
        messages: MessageAI[]
    ) {
        // Only proceed if there is a user last message
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role !== 'user') return;

        // Let's loop through the corpora
        for (const corpusId of taskDefinition.corpusIds) {
            const chunks = await this.db.queryCorpus(
                userId,
                corpusId,
                lastMessage.content,
                taskDefinition.corpusLimit,
                taskDefinition.corpusSimilarityThreshold
            );
            for (const chunk of chunks) {
                lastMessage.content += `\n\nRetrieved information:\n${chunk}`;
            }
        }
    }
}
