import { ServerToolsRegistry, ServerToolsBase, Tool, ToolParameter} from '@/lib/task-definition-types';


export class GlobalServerTools extends ServerToolsBase {


    
}

ServerToolsRegistry.register("Global Server Tools", GlobalServerTools);
