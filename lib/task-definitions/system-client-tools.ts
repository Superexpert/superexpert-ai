
import {
    registerClientTool,
    ClientToolsBase,
    Tool,
    ToolParameter,
} from '@superexpert-ai/superexpert-ai-plugins';

export class SystemClientTools extends ClientToolsBase {
    @Tool({
        name: 'transition',
        description: 'Call this tool to end the current task and transition to a new task'
    })
    public async transition(
        @ToolParameter({
            name: 'taskName',
            description: 'The task to transition to',
        })
        taskName: string
    ) {
        taskName = taskName.toLowerCase();

        // Set new task
        const previousTask = this.clientContext.getCurrentTask();
        const newTask = this.clientContext.getTask(taskName);

        // Does the new task actually exist?
        if (!newTask) {
            return `Could not transition to ${taskName} because ${taskName} was not found`;
        }

        // Set the new task
        this.clientContext.setTask(newTask.name);

        // Set new thread?
        if (newTask.startNewThread) {
            this.clientContext.setThread(crypto.randomUUID());
        }
        return `Successfully transitioned from ${previousTask.name} to ${newTask.name}`;
    }
}

registerClientTool(SystemClientTools);

