import { Tool, ServerDataBase } from '@/lib/task-definition-types';

export class CustomServerData extends ServerDataBase {
    @Tool({ name: 'loadMemories', description: 'Loads memories' })
    public async loadMemories() {
        return `I remember you like red ${this.user.id}`;
    }

    @Tool({
        name: 'agentInfo',
        description: 'This tool returns the current agent id and name',
    })
    public async whichAgent(
    ) {
        console.log(`I am ${this.agent.id} with name ${this.agent.name} and I am awesome`);
        return `I am ${this.agent.id} with name ${this.agent.name} and I am awesome`;
    }



}
