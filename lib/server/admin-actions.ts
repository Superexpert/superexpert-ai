'use server';
import {ToolsBuilder} from '@/lib/tools-builder';
import {TaskDefinition} from '@/lib/task-definition';
import {DBAdminService} from '@/lib/db/db-admin-service';
import {redirect} from "next/navigation";
import { z } from "zod";

export async function getServerData() {
  const builder = new ToolsBuilder();
  const result = builder.getServerDataList();
  return result;
}


export async function getServerTools() {
  const builder = new ToolsBuilder();
  const result = builder.getCustomServerToolList();
  return result;
}


export async function getClientTools() {
  const builder = new ToolsBuilder();
  const result = builder.getClientToolList();
  return result;
}


const taskDefinitionSchema = z.object({
  name: z.string().nonempty("Task Name is required"),
  description: z.string().nonempty("Task Description is required"),
  instructions: z.string(),
  serverToolIds: z.array(z.string()),
  isSystem: z.boolean(),
  id: z.number().optional(),
});



export async function saveTaskDefinitionAction(prevState: any, formData: FormData)
: Promise<{success:boolean, errors: any, values: TaskDefinition}> 
{
  const newTaskDefinition: TaskDefinition = {
    id: formData.get("id") ? Number(formData.get("id")) : prevState.values.id,
    isSystem: formData.get("isSystem") === "true",
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    instructions: formData.get("instructions") as string,
    serverDataIds: formData.getAll("serverDataIds") as string[],
    serverToolIds: formData.getAll("serverToolIds") as string[],
    clientToolIds: formData.getAll("clientToolIds") as string[],
  };

  console.log("newTaskDefinition", formData);

  const result = taskDefinitionSchema.safeParse(newTaskDefinition);
  let errors = {};
  if (!result.success) {
    errors = result.error.flatten().fieldErrors;    
  } else {
    const db = new DBAdminService();
    await db.saveTaskDefinition(newTaskDefinition);
    redirect("/admin");
  }

  return {
    success: result.success,
    errors: errors,
    values: newTaskDefinition,
  }
}

export async function deleteTaskDefinition(id: number) {
  const db = new DBAdminService();
  const result = await db.deleteTaskDefinition(id);
  redirect("/admin");
}

export async function getTaskDefinitionList() {
  const db = new DBAdminService();
  const result = await db.getTaskDefinitionList();
  return result;
}

export async function getTaskDefinitionById(id: number) {
  const db = new DBAdminService();
  const result = await db.getTaskDefinitionById(id);
  return result;
}


