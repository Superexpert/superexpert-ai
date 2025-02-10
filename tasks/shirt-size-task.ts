import BaseServerTask from '@/lib/types/base-server-task';

const instructions = `
Work on code.
`;

@ServerTask()
class ShirtSizeTask extends BaseServerTask {
  name = "shirt size";
  instructions = instructions;

  @ServerTool()
  async saveShirtSize() {
    console.log("Saving shirt size...");
  }
}

export default new ShirtSizeTask(); // Export as a singleton if needed
