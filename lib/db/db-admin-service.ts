
import { TaskDefinition } from '../task-definition';
import { Agent } from '../agent';
import {prisma} from './prisma';


export class DBAdminService {

    constructor(protected userId:string) {}


    //** TaskDefinitionForm **//


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
 
    //** TaskDefinitionList **//

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

    //** AgentListPage **//

    public async getAgentList() {
        let agents = await prisma.agents.findMany(
            {
                where: {
                    userId: this.userId,
                },
                orderBy: {
                    name: 'asc'
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            }
        );
        return agents;
    }

    public async getAgentById(id: string) {
        const agent = await prisma.agents.findUnique({
            where: {
                id,
            }
        });
        if (!agent) {
            throw new Error('Agent not found');
        }
        return agent;
    }

    //** AgentForm **//

    public async getAgentByName(name: string) {
        const agent = await prisma.agents.findUnique({
            where: {
                name: name,
            }
        });
        return agent;
    }


    public async saveAgent(data: Agent) {
        // Update existing
        if (data.id) {
            const existingAgent = await prisma.agents.findUnique({
                where: {
                    id: data.id,
                }
            });
            if (!existingAgent) {
                throw new Error('Agent not found');
            }

            await prisma.agents.update({
                where: {
                    id: data.id,
                },
                data: {
                    name: data.name,
                    description: data.description,
                }
            });

            return existingAgent;
        }
        // save new
        const newAgent = await prisma.agents.create({
            data: {
                userId: this.userId,
                name: data.name,
                description: data.description,
            }
        });

        return newAgent;
    }

    public async deleteAgent(id: string) {
        await prisma.agents.delete({
            where: {
                id: id
            }
        });
        return true;
    }


}