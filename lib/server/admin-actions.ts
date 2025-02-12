'use server';
import {ServerTools} from '@/task-definitions/server-tools';
import {getServerToolList} from '@/lib/task-types';
import {TaskDefinition} from '@/lib/task-definition';
import {DBAdminService} from '@/lib/db/db-admin-service';
import {redirect} from "next/navigation";


export async function getServerTools() {
  new ServerTools();
  const result = getServerToolList();
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


