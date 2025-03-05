import {
    ClientToolsBase,
    Tool,
    ToolParameter,
} from '@/lib/task-definition-types';
import { START_MESSAGE } from '@/superexpert.config';

export class SystemClientTools extends ClientToolsBase {
    @Tool(
        'transition',
        'Call this tool to end the current task and transition to a new task'
    )
    public async transition(
        @ToolParameter({
            name: 'taskName',
            description: 'The task to transition to',
        })
        task: string
    ) {

        // Set new task
        const previousTask = this.clientContext.getTask();
        const newTask = task.toLowerCase();
        this.clientContext.setTask(newTask);

        // Set new thread
        this.clientContext.setThread(crypto.randomUUID());


        // Send START_MESSAGE
        //await this.clientContext.sendMessages([{ role: 'user', content: START_MESSAGE }]);
        

        return `Successfully transitioned from ${previousTask} to ${newTask}`;
    }
}
