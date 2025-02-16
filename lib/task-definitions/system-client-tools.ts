import {ClientToolsBase, Tool, ToolParameter} from '@/lib/task-definition-types';
import {setSessionItem} from '@/lib/session-storage';


export class SystemClientTools extends ClientToolsBase {

    @Tool('transition', 'Call this tool to end the current task and transition to a new task')
    public async transition(
        @ToolParameter('task', 'The task to transition to')
        task: string,
    ) {
        setSessionItem("task", task);
        sessionStorage.removeItem("thread");
        return `Successfully transitioned to ${task}`;
    }
}


