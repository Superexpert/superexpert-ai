import {TaskMachine, ServerTool} from '@/lib/task-types';
import homeTask from '@/tasks/home-task';
import shirtSizeTask from './shirt-size-task';

const instructions = `
Always be kind.
`;


export default new (class extends TaskMachine {
    instructions = instructions;
    tasks = [
        homeTask,
        shirtSizeTask,
    ];

    @ServerTool()
    async saveHome() {
        console.log("Saving home...");
    }


})();



