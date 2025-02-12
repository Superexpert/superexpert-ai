'use server';
import {ServerTools} from '@/task-definitions/server-tools';
import {ServerToolsBuilder} from '@/lib/server-tools-builder';
import {TaskDefinition} from '@/lib/task-definition';
import {DBAdminService} from '@/lib/db/db-admin-service';
import {redirect} from "next/navigation";


export async function getServerTools() {
  const builder = new ServerToolsBuilder();
  const result = builder.getServerToolList();
  return result;
}


export async function saveTaskDefinition(data: TaskDefinition) {
  const db = new DBAdminService();
  const result = await db.saveTaskDefinition(data);
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


