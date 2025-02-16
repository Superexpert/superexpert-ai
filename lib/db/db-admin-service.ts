
import { MessageAI } from '../message-ai';
import { TaskDefinition } from '../task-definition';
import {prisma} from './prisma';

export class DBAdminService {

    public async saveTaskDefinition(data: TaskDefinition) {
        // Update existing
        if (data.id) {
            const existingTaskDefinition = await prisma.taskDefinitions.findUnique({
                where: {
                    id: data.id
                }
            });
            if (!existingTaskDefinition) {
                throw new Error('Task Definition not found');
            }

            await prisma.taskDefinitions.update({
                where: {
                    id: data.id
                },
                data: {
                    name: data.name,
                    description: data.description,
                    instructions: data.instructions,
                    serverDataIds: data.serverDataIds,
                    serverToolIds: data.serverToolIds,
                    clientToolIds: data.clientToolIds,
                    updatedBy: "bob"
                }
            });

            return existingTaskDefinition;
        }
        // save new
        const newTaskDefinition = await prisma.taskDefinitions.create({
            data: {
                name: data.name,
                description: data.description,
                instructions: data.instructions,
                serverToolIds: data.serverToolIds,
                createdBy: "bob",
                updatedBy: "bob"
            }
        });

        return newTaskDefinition;
    }

    public async getTaskDefinitionById(id: number) {
        const td = await prisma.taskDefinitions.findUnique({
            where: {
                id: id
            }
        });
        if (!td) {
            throw new Error('Task Definition not found');
        }
        return {
            id: td.id,
            isSystem: td.isSystem,
            name: td.name,
            description: td.description,
            instructions: td.instructions,
            serverDataIds: td.serverDataIds,
            serverToolIds: td.serverToolIds,
            clientToolIds: td.clientToolIds,
        };
    }


    public async deleteTaskDefinition(id: number) {
        await prisma.taskDefinitions.delete({
            where: {
                id: id
            }
        });
        return true;
    }
 
    public async getTaskDefinitionList() {
        let taskDefinitions = await prisma.taskDefinitions.findMany(
            {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
                orderBy: [
                    {isSystem: 'desc'}, {name: 'asc'}
                ]
            }
        );

        if (taskDefinitions.length === 0) {
            taskDefinitions = await this.createSystemTaskDefinitions();
        }

        return taskDefinitions;
    }

    public async createSystemTaskDefinitions() {
        const systemTaskDefinitions = [
            {
                name: 'Home',
                description: 'The first task when a user starts a new conversation.',
                instructions: '',
                serverDataIds: [],
                serverToolIds: [],
                clientToolIds: [],
            },
            {
                name: 'Global',
                description: 'Instructios, data, and tools applied to all tasks.',
                instructions: '',
                serverDataIds: [],
                serverToolIds: [],
                clientToolIds: [],
            },
        ];

        const results = [];
        for (const taskDefinition of systemTaskDefinitions) {
            const result = await prisma.taskDefinitions.create({
                data: {
                    ...taskDefinition,
                    isSystem: true,
                    createdBy: "system",
                    updatedBy: "system"
                }
            });
            results.push(result);
        }
        return results;
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