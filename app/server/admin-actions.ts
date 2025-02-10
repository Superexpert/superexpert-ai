'use server';
import { DbService } from '@/superexpert-ai/db/db-service';
import { getFunctionsFromFolder } from "@/lib/generate-tools";


export async function getTaskDefinitions() {
    const db = new DbService();
    const taskDefinitions = await db.getTaskDefinitions();
    return taskDefinitions;   
}

export async function generateTools() {
    const tools = await getFunctionsFromFolder("./superexpert-ai/tasks/home/functions");
    console.log(JSON.stringify(tools, null, 2));        
}
