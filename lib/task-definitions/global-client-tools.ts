import {Tool, ToolParameter} from '@/lib/task-types';



export class GlobalClientTools {

    @Tool('transition', 'Call this tool to end the current task and transition to a new task')
    public async transition(
        @ToolParameter('task', 'The task to transition to')
        task: string
    ) {
        console.log('transition is awesome');
        return `Transitioning to ${task}`;
    }
}