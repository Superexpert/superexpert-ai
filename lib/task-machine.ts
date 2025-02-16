import { DBService } from '@/lib/db/db-service';
import { MessageAI} from '@/lib/message';
import { TaskDefinition } from './task-definition';
import { ToolAI } from '@/lib/tool-ai';
import { ToolsBuilder } from './tools-builder';

export class TaskMachine {

    private readonly MAX_MESSAGES = 30;

    private db: DBService;

    constructor() {
        this.db = new DBService();
    }

    public async getAIPayload(userId:string, task:string, thread:string, messages: MessageAI[])
    : Promise<{currentMessages: MessageAI[], tools: ToolAI[]}> {
        // Save messages
        await this.saveMessages(userId, task, thread, messages);

        // Get previous messages
        const previousMessages = await this.getPreviousMessages(userId, thread);

        // Get task definition
        const taskDefinitions = await this.getTaskDefinitions();
        let taskDefinition = taskDefinitions.find(td => td.name === task);

        // default task to Home if not found
        if (!taskDefinition) {
            task = 'Home';
            taskDefinition = taskDefinitions.find(td => td.name === task);
        }
        if (!taskDefinition) {
            throw new Error(`Task definition not found for task: ${task}`);
        }


        const globalTaskDefinition = taskDefinitions.find(td => td.name === 'Global');
        if (!globalTaskDefinition) {
            throw new Error(`Task definition not found for task: Global`);
        }

        // Get system messages
        const systemMessages = await this.getSystemMessages(taskDefinition, globalTaskDefinition);

        // Get tools
        const tools = this.getTools(taskDefinition, globalTaskDefinition);

        return {
            currentMessages:[...systemMessages, ...previousMessages], 
            tools:tools,
        };
    }

    private getTools(taskDefinition:TaskDefinition, globalTaskDefinition:TaskDefinition): ToolAI[] {
        // merge server, client, task, and global tool ids
        const toolIds: string[] = [...new Set([
            ...taskDefinition.serverToolIds,
            ...taskDefinition.clientToolIds, 
            ...globalTaskDefinition.serverToolIds,
            ...globalTaskDefinition.clientToolIds
        ])];
        const builder = new ToolsBuilder();
        const tools = builder.getTools(toolIds);
        return tools;
    }

    private async getSystemMessages(
        taskDefinition: TaskDefinition, 
        globalTaskDefinition:TaskDefinition
    ):Promise<MessageAI[]>  {
        return [
            { role: 'system', content: globalTaskDefinition.instructions },
            { role: 'system', content: taskDefinition.instructions }
        ];


        // const baseData = this.fetchData ? await this.fetchData(userId, now, timeZone) : '';
        // const machineIntructions = this.baseInstructions + this.toolInstructions + baseData;

        // const stateData = state.fetchData ? await state.fetchData(userId, now, timeZone) : '';
        // const stateInstructions = state.instructions
        //     + `\nFunctions Available:\n${state.toolInstructions || ''}`
        //     + `\nTransition Instructions:\ ${state.transitionInstructions}`
        //     + `When you transition from the current state, call the 'transition' function.`
        //     + stateData;

        // return [
        //     { role: 'system', content: machineIntructions },
        //     { role: 'system', content: stateInstructions },
        // ];
    }

    private async getTaskDefinitions() {
        const result = await this.db.getTaskDefinitions();
        return result;
    }


    public async saveMessages(userId:string, task:string, thread:string, messages: MessageAI[]) { 
        await this.db.saveMessages(userId, task, thread, messages);
    }


    private async getPreviousMessages(userId:string, thread:string) {
        const result = await this.db.getMessages(userId, thread, this.MAX_MESSAGES);
        return result;
    }

}