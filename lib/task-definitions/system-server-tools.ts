import { ServerToolsRegistry, ServerToolsBase, Tool, ToolParameter} from '@/lib/task-definition-types';


export class SystemServerTools extends ServerToolsBase {

    @Tool('getCurrentTime', 'Get the current time')
    public async getCurrentTime() {
        return new Date().toISOString();
    }

    @Tool('getCurrentDate', 'Get the current date')
    public async getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }
    
}

