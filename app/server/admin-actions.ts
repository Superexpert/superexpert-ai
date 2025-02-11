'use server';
import taskMachine from '@/tasks/task-machine';


export async function doServerAction() {
    console.log("Server action");
    const result = taskMachine.getAIPayload("123", "UTC", []);
    return "world";
}