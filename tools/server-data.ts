import { registerServerDataTool } from "@superexpert-ai/framework";
import { prisma } from "@/lib/db/prisma";

registerServerDataTool({
    name: 'whichAgent',
    description: 'This tool returns the current agent id and name',
    function() {
        return `My agent id is ${this.agent.id} and my agent name is ${this.agent.name} and I am awesome`;
    },
});

registerServerDataTool({
    name: 'loadMemories',
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



// import { registerServerDataTool, Tool, ServerDataBase } from '@superexpert-ai/framework';

// export class CustomServerData extends ServerDataBase {
//     @Tool({ name: 'loadMemories', description: 'Loads memories' })
//     public async loadMemories() {
//         return `I remember you like red ${this.user.id}`;
//     }

//     @Tool({
//         name: 'agentInfo',
//         description: 'This tool returns the current agent id and name',
//     })
//     public async whichAgent() {
//         console.log(
//             `My agent id is ${this.agent.id} and my agent name is ${this.agent.name} and I am awesome`
//         );
//         return `My agent id is ${this.agent.id} and my agent name is ${this.agent.name} and I am awesome`;
//     }
// }

// registerServerDataTool(CustomServerData);
