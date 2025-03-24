import { registerClientTool } from "@superexpert-ai/framework";


registerClientTool({
    name: 'transition', 
    description: 'Call this tool to end the current task and transition to a new task,',
    parameters: [
        {
            name: 'taskName',
            type: 'string',
            description: 'The task to transition to',
        },
    ],
    function(taskName) {
        taskName = taskName.toLowerCase();

        // Set new task
        const previousTask = this.getCurrentTask();
        const newTask = this.getTask(taskName);

        // Does the new task actually exist?
        if (!newTask) {
            return `Could not transition to ${taskName} because ${taskName} was not found`;
        }

        // Set the new task
        this.setTask(newTask.name);

        // Set new thread?
        if (newTask.startNewThread) {
            this.setThread(crypto.randomUUID());
        }
        return `Successfully transitioned from ${previousTask.name} to ${newTask.name}`;
    }
});




