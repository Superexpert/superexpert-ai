import { TaskDefinition, ServerTool } from '@/lib/task-types';

const instructions = `
Ask the user for their shirt size.
`;

export default new (class ShirtSizeTask extends TaskDefinition {
    name = "shirt size";
    instructions = instructions;

    @ServerTool()
    async saveShirtSize() {
        console.log("Saving shirt size...");
    }
})();
