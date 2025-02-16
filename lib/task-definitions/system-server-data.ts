import {ServerDataBase, Tool, ToolParameter} from '@/lib/task-definition-types';


export class SystemServerData extends ServerDataBase {

    @Tool('loadProfile', 'Load the user profile')
    public async loadProfile() {
        return `Successfully loaded profile`;
    }
}


