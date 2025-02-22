import { Tool, ServerDataBase } from '@/lib/task-definition-types';

export class CustomServerData extends ServerDataBase {
    @Tool('loadMemories', 'Loads memories')
    public async loadMemories() {
        console.log('Retrieing memories');
        return `I remember you like red ${this.user.id}`;
    }
}
