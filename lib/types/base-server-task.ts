export default abstract class BaseServerTask {
    abstract name: string;
    abstract instructions: string;
  
    // Optionally define shared behavior
    execute(): void {
      console.log(`Executing task: ${this.name}`);
    }
  }