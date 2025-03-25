import { registerServerDataTool } from "@superexpert-ai/framework";
import { prisma } from "@/lib/db/prisma";

registerServerDataTool({
    name: 'whichAgent',
    category: 'sample',
    description: 'This tool returns the current agent id and name',
    function() {
        return `My agent id is ${this.agent.id} and my agent name is ${this.agent.name} and I am awesome`;
    },
});

registerServerDataTool({
    name: 'loadMemories',
    category: 'sample',
    description: 'Loads memories',
    async function() {
        const memories = await prisma.memories.findMany({
            where: {
                userId: this.user.id,
                agentId: this.agent.id,
            },
            orderBy: {
                createdAt: 'desc',  
            }
        });
        return memories.map(memory => `${memory.createdAt} - ${memory.content}`).join('\n');

    },
});


