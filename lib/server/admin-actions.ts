'use server';
import {ToolsBuilder} from '@/lib/tools-builder';
import {TaskDefinition} from '@/lib/task-definition';
import {DBAdminService} from '@/lib/db/db-admin-service';
import {redirect} from "next/navigation";
import { z } from "zod";
import { getUserId } from '@/lib/user';
import { Agent } from '@/lib/agent';


//** TaskDefinitionForm **//


export async function getServerDataAction() {
  const builder = new ToolsBuilder();
  const result = builder.getServerDataList();
  return result;
}


export async function getServerToolsAction() {
  const builder = new ToolsBuilder();
  const result = builder.getServerToolList();
  return result;
}


export async function getClientToolsAction() {
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
  const userId = await getUserId();

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

  const result = taskDefinitionSchema.safeParse(newTaskDefinition);
  let errors = {};
  if (!result.success) {
    errors = result.error.flatten().fieldErrors;    
  } else {
    const db = new DBAdminService(userId);
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
  const userId = await getUserId();

  const db = new DBAdminService(userId);
  const result = await db.deleteTaskDefinition(id);
  redirect("/admin");
}


export async function getTaskDefinitionByIdAction(id: number) {
  const userId = await getUserId();

  const db = new DBAdminService(userId);
  const result = await db.getTaskDefinitionById(id);
  return result;
}

//** TaskListPage **//

export async function getTaskDefinitionList() {
  const userId = await getUserId();

  const db = new DBAdminService(userId);
  const result = await db.getTaskDefinitionList();
  return result;
}


//** AgentListPage **//

export async function getAgentList() {
  const userId = await getUserId();

  // Get agents
  const db = new DBAdminService(userId);
  const result = await db.getAgentList();
  return result;
}

export async function getAgentByIdAction(id: string) {
  const userId = await getUserId();

  const db = new DBAdminService(userId);
  const result = await db.getAgentById(id);
  return result;
}

//** AgentForm **//


const agentSchema = z.object({
  id: z.string().optional(),
  name: z.string().nonempty("Agent Name is required"),
  description: z.string().nonempty("Agent Description is required"),
});


export async function saveAgentAction(prevState: any, formData: FormData)
: Promise<{success:boolean, errors: any, values: Agent}> 
{
  const userId = await getUserId();

  const newAgent: Agent = {
    id: formData.get("id") ? formData.get("id") : prevState.values.id,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
  };

  const result = agentSchema.safeParse(newAgent);
  let errors = {};
  if (!result.success) {
    errors = result.error.flatten().fieldErrors;    
    console.log("errors", errors);
  } else {
    const db = new DBAdminService(userId);
    await db.saveAgent(newAgent);
    redirect("/");
  }

  return {
    success: result.success,
    errors: errors,
    values: newAgent,
  }
}

export async function deleteAgentAction(id: string) {
  const userId = await getUserId();

  const db = new DBAdminService(userId);
  const result = await db.deleteAgent(id);
  redirect("/");
}