import { DBService } from '@/lib/db/db-service';
import { MessageAI } from '@/lib/message';
import { TaskDefinition } from './task-definition';
import { ToolAI } from '@/lib/tool-ai';
import { ToolsBuilder } from './tools-builder';
import { User } from '@/lib/user';

export class TaskMachine {
    private readonly MAX_MESSAGES = 30;

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
    }> {
        // Save messages
        await this.saveMessages(user.id, agentId, task, thread, messages);

        // Get previous messages
        const previousMessages = await this.getPreviousMessages(
            user.id,
            thread
        );

        // Get task definition
        const taskDefinitions = await this.getTaskDefinitions(agentId);
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

        return serverData 
            + globalTaskDefinition.instructions
            + taskDefinition.instructions;
    }

    private async getTaskDefinitions(agentId: string) {
        const result = await this.db.getTaskDefinitions(agentId);
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
        const result = await this.db.getMessages(
            userId,
            thread,
            this.MAX_MESSAGES
        );
        return result;
    }
}
