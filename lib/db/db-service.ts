
import { MessageAI } from '../message-ai';
import { TaskDefinition } from '../task-definition';
import {prisma} from './prisma';

export class DBService {

    public async saveTaskDefinition(data: TaskDefinition) {
        const newTaskDefinition = await prisma.taskDefinitions.create({
            data: {
                name: data.name,
                instructions: data.instructions,
                serverToolIds: data.serverToolIds.join(','),
                createdBy: "bob",
                updatedBy: "bob"
            }
        });

        return newTaskDefinition;
    }

    public async getTaskDefinitionList() {
        const taskDefinitions = await prisma.taskDefinitions.findMany(
            {
                select: {
                    id: true,
                    name: true,
                }
            }
        );
        return taskDefinitions.map(td => {
            return {
                id: td.id,
                description: td.name
            }});
    }



    public async getLastTask(userId:string) {
        const lastTask = await prisma.tasks.findFirst({
            where: {
                userId: userId,
            },
            orderBy: {
                id: 'desc'
            }
        });

        return lastTask;
    }

    public async abandonTask(userId:string, id:number) {
        await prisma.tasks.update({
            where: {
                userId: userId,
                id: id
            },
            data: {
                status: 'abandoned'
            }
        });
    }

    public async createTask(userId:string, thread:string, name:string) {
        const newTask = await prisma.tasks.create({
            data: {
                userId: userId,
                thread: thread,
                name: name,
                status: 'active'
            }
        });

        return newTask;
    }

    public async updateTask(userId:string, id:number) {
        await prisma.tasks.update({
            where: {
                userId: userId,
                id: id
            },
            data: {
                lastUpdatedAt: new Date()
            }
        });
    }

    public async saveMessages(userId:string, task:string, thread:string, messages:MessageAI[]) {
        const fullMessages = messages.map(m => {
            return {
                userId: userId,
                task: task,
                thread: thread,
                role: m.role,
                content: m.content,
                ...('tool_calls' in m && m.tool_calls?.length ? {tool_calls: JSON.stringify(m.tool_calls)}:{}),
                ...('tool_call_id' in m ? {tool_call_id: m.tool_call_id}:{}),
            }
        });

        await prisma.messages.createMany({
            data: fullMessages
        });
        return true;
    }

}