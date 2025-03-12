import { PrismaClient } from '@prisma/client';

/*****
 * This script is used to delete data from the demo site.
 */

// These are agents to preserve
let preserveAgentNames: string[] = [];
const demoAgents = process.env.NEXT_PUBLIC_DEMO_AGENTS;
if (demoAgents) {
    preserveAgentNames = demoAgents.split(',');
}

const prisma = new PrismaClient();

async function main() {
    // Get list of agents to delete
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const agentsToDelete = await prisma.agents.findMany({
        where: {
            name: {
                notIn: preserveAgentNames,
            },
            createdAt: {
                lt: oneDayAgo,
            },
        },
        select: {
            id: true,
        },
    });
    const agentIdsToDelete = agentsToDelete.map((agent) => agent.id);
    console.log(`Deleting ${agentIdsToDelete.length} agents`);

    // Delete associated messages
    const deleteMessages = await prisma.messages.deleteMany({
        where: {
            agentId: {
                in: agentIdsToDelete,
            },
        },
    });
    console.log(`Deleted ${deleteMessages.count} messages`);

    // Fetch task definitions to delete
    const taskDefinitionsToDelete = await prisma.taskDefinitions
        .findMany({
            where: {
                agentId: {
                    in: agentIdsToDelete,
                },
            },
            select: {
                id: true,
            },
        })
        .then((tasks) => tasks.map((task) => task.id));

    // Delete associated tasks
    const deleteTasks = await prisma.taskDefinitions.deleteMany({
        where: {
            id: {
                in: taskDefinitionsToDelete,
            },
        },
    });
    console.log(`Deleted ${deleteTasks.count} tasks`);

    // Delete associated attachments
    const deleteAttachments = await prisma.attachments.deleteMany({
        where: {
            taskDefinitionId: {
                in: taskDefinitionsToDelete,
            },
        },
    });

    // Delete agents
    const deleteAgents = await prisma.agents.deleteMany({
        where: {
            id: {
                in: agentIdsToDelete,
            },
        },
    });
    console.log(`Deleted ${deleteAgents.count} agents`);

    console.log('All Done!');
}

main()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
