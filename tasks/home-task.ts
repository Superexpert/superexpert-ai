import { TaskDefinition } from '@/lib/task-types';

const instructions = `
Ask the user for their name.
`;

export default new (class ShirtSizeTask extends TaskDefinition {
    name = "home";
    instructions = instructions;


})();
