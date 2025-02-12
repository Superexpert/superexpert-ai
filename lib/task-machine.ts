import { DBService } from '@/lib/db/db-service';
import { MessageAI} from '@/lib/message';
import { TaskDefinition } from './task-definition';
import { ToolAI } from '@/lib/tool-ai';
import { ServerToolsBuilder } from './server-tools-builder';

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
        const taskDefinition = await this.getTaskDefinition(task);


        // Get system messages
        const systemMessages = await this.getSystemMessages(taskDefinition);

        // Get server tools
        const serverTools = this.getServerTools(taskDefinition.serverToolIds);

        return {
            currentMessages:[...systemMessages, ...previousMessages], 
            tools:serverTools,
        };
    }

    private getServerTools(serverTools:string[]): ToolAI[] {
        const builder = new ServerToolsBuilder();
        const tools = builder.getTools(serverTools);
        return tools;
    }

    private async getSystemMessages(taskDefinition: TaskDefinition):Promise<MessageAI[]>  {
        return [
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


    private async getTaskDefinition(task:string) {
        const result = await this.db.getTaskDefinition(task);
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