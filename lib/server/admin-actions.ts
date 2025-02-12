'use server';
import {ServerTools} from '@/task-definitions/server-tools';
import {getServerToolList} from '@/lib/task-types';
import {TaskDefinition} from '@/lib/task-definition';
import {DBService} from '@/lib/db/db-service';
import {redirect} from "next/navigation";


export async function getServerTools() {
  new ServerTools();
  const result = getServerToolList();
  return result;
}


export async function saveTaskDefinition(data: TaskDefinition) {
  const db = new DBService();
  const result = await db.saveTaskDefinition(data);
      // Redirect after submission
      redirect("/admin");
}

export async function getTaskDefinitionList() {
  const db = new DBService();
  const result = await db.getTaskDefinitionList();
  return result;
}


