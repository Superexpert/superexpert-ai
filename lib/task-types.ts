import {MessageAI} from './message-ai';
import {ToolAI} from './tool-ai';
import {DBService} from './db/db-service';
import {randomUUID } from 'crypto';


const serverTools: Function[] = [];


export interface Task {
    id: number;
    name: string;
    thread: string;
    createdAt: Date;
    lastUpdatedAt: Date;
    status: 'active'|'abandoned'|'completed';
}


export abstract class TaskDefinition {
    abstract name: string;
    abstract instructions: string;  
}


 
export function ServerTool(): ClassDecorator {
    return function (target: Function) {
        serverTools.push(target);
    };
}


export abstract class TaskMachine {
    abstract tasks: TaskDefinition[];    
    abstract instructions: string;
    db: DBService;

    constructor() {
        this.db = new DBService();
    }

    public async getAIPayload(
        userId:string, 
        timeZone:string,
        messages:MessageAI[], 
        ): Promise<{currentMessages:MessageAI[], currentTools:ToolAI[]}> 
    {
        // Get the current task
        const currentTask = await this.getCurrentTask(userId);
        if (!currentTask) {
            throw new Error("No current task");
        }

        // Get the current task definition
        const currentTaskDefinition = this.tasks.find(t => t.name === currentTask.name);
        if (!currentTaskDefinition) {
            throw new Error("No current task definition");
        }
        console.log("current task", currentTask);

        // Save the new messages
        this.db.saveMessages(
            userId, 
            currentTask.name, 
            currentTask.thread, 
            messages
        );


        // Get the system instructions
        this.getSystemInstructions(timeZone, currentTaskDefinition);

        // Get the current tools

        // Get the previous messages

        return {currentMessages: [], currentTools: []};
    }

    private getSystemInstructions(timeZone:string, currentTaskDefinition:TaskDefinition) {
        const messageBaseInstructions: MessageAI = {
            role: 'system',
            content: this.instructions,
        };
        const messageTaskInstructions: MessageAI = {
            role: 'system',
            content: currentTaskDefinition.instructions,
        };
        const messageCustomInstructions: MessageAI = {
            role: 'system',
            content: this.get,
        };
    }

    private async getCurrentTask(userId:string) {
        const lastTask = await this.db.getLastTask(userId);

        // Should we abandon it?
        const thirtyMinutesAgo = new Date(new Date().getTime() - 1000 * 60 * 30);
        if (lastTask && lastTask.status === 'active' && lastTask.lastUpdatedAt < thirtyMinutesAgo) {
            await this.db.abandonTask(userId, lastTask.id);
            lastTask.status = 'abandoned';
        }

        // If there is no last task, or the task is abandoned, start a new task
        if (!lastTask || lastTask.status !== 'active') {
            const defaultTask = await this.startDefaultTask(userId);
            return defaultTask;
        }

        // Otherwise, update and return the last task
        await this.db.updateTask(userId, lastTask.id);
        return lastTask;
    }

    private async startDefaultTask(userId:string) {
        const defaultTask = this.getDefaultTask();
        const thread = this.getNewThread();
        const newTask = await this.db.createTask(userId, thread, defaultTask.name);
        return newTask;
    }

    private getNewThread() {
        return randomUUID().toString();
    }

    private getDefaultTask() {
        const defaultTask = this.tasks.find(t => t.name === 'home');
        if (!defaultTask) {
            throw new Error("No default task found");
        }
        return defaultTask;
    }



    public async executeAllTasks() {
        console.log("go speed racer");
    }




    @ServerTool()
    async transition(nextTask:string) {
        console.log(`Transitioning to ${nextTask}`);
    }
}
