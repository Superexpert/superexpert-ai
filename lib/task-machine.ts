import { DBService } from '@/lib/db/db-service';
import { MessageAI, ToolAI, User, LLMModelConfiguration, callContextTool, ContextToolContext } from '@superexpert-ai/framework';
import { TaskDefinition } from './task-definition';
import { buildTools } from './build-tools';
import { prisma } from '@/lib/db/prisma';
import { getRAGStrategy, RAGStrategyContext } from '@superexpert-ai/framework';
//import { baseLog } from '@superexpert-ai/framework/server';

export class TaskMachine {
    private db: DBService;

    constructor() {
        this.db = new DBService();
    }

    public async getAIPayload(
        user: User,
        agentId: string,
        agentName: string,
        task: string,
        thread: string,
        messages: MessageAI[]
    ): Promise<{
        instructions: string;
        currentMessages: MessageAI[];
        tools: ToolAI[];
        modelId: string;
        modelConfiguration: LLMModelConfiguration;
    }> {
        // // Create logger
        // const log = baseLog.child({
        //     userId: user.id,
        //     agentId: agentId,
        //     component: '@superexpert-ai',
        // });

        // log.info('getAIPayload', {
        //     userId: user.id,
        //     agentId: agentId,
        //     task: task,
        //     thread: thread,
        //     messages: messages,
        // });


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

        await this.augmentMessages(
            user.id,
            taskDefinition,
            globalTaskDefinition,
            messages
        );

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
            agentId,
            agentName,
            taskDefinition,
            globalTaskDefinition,
            previousMessages
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
    ): LLMModelConfiguration {
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
                ...globalTaskDefinition.serverToolIds,
                ...taskDefinition.contextToolIds,
                ...globalTaskDefinition.contextToolIds,
                ...taskDefinition.clientToolIds,
                ...globalTaskDefinition.clientToolIds,
            ]),
        ];


        const tools = buildTools(toolIds);
        return tools;
    }

    private async getContextToolData(
        user: User,
        agent: {id:string, name:string},
        taskDefinition: TaskDefinition,
        globalTaskDefinition: TaskDefinition,
        messages: MessageAI[]
    ): Promise<string> {
        // merge server data ids
        const contextToolIds: string[] = [
            ...new Set([
                ...taskDefinition.contextToolIds,
                ...globalTaskDefinition.contextToolIds,
            ]),
        ];
        let result = '';
        const context: ContextToolContext = {
            user: {
                id: user.id!,
                now: new Date(),
                timeZone: user.timeZone,
            },
            agent: {
                id: agent.id,
                name: agent.name,
            },
            messages: messages,
            db: prisma,
        };
        for (const contextToolId of contextToolIds) {
            const data = await callContextTool(contextToolId, context, {});
            result += `${data}\n`;
        }
        return result;
    }

    private async getInstructions(
        user: User,
        agentId: string,
        agentName: string,
        taskDefinition: TaskDefinition,
        globalTaskDefinition: TaskDefinition,
        messages: MessageAI[]
    ): Promise<string> {
        const agent = {id: agentId, name: agentName};
        const contextToolData = await this.getContextToolData(
            user,
            agent,
            taskDefinition,
            globalTaskDefinition,
            messages
        );

        const attachments = await this.db.getFullAttachments(user.id, [
            taskDefinition.id!,
            globalTaskDefinition.id!,
        ]);
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
            contextToolData +
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
        globalTaskDefinition: TaskDefinition,
        messages: MessageAI[]
    ) {
        // Only proceed if there are corpus ids
        const uniqueCorpusIds = [...new Set( [...taskDefinition.corpusIds, ...globalTaskDefinition.corpusIds])];
        if (uniqueCorpusIds.length === 0) {
            return;
        }

        // Only proceed if there is a user last message
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role !== 'user') return;

        const strategyId = taskDefinition.ragStrategyId == 'global' ? globalTaskDefinition.ragStrategyId : taskDefinition.ragStrategyId;

        const ragStrategy = getRAGStrategy(strategyId);
        if (!ragStrategy) {
            throw new Error(`RAG strategy ${strategyId} not found`);
        }

    
        const ctx: RAGStrategyContext = {
            userId,
            corpusIds: uniqueCorpusIds,                  
            query: lastMessage.content,
            limit:   taskDefinition.corpusLimit,
            similarityThreshold: taskDefinition.corpusSimilarityThreshold,
            db: prisma,
        };
    
        const chunks = await ragStrategy.function.call(ctx);

        for (const chunk of chunks) {
            lastMessage.content += `\n\Retrieved information:\n${chunk.chunk}\n\nSource: ${chunk.fileName}`;
        }
    }
}
