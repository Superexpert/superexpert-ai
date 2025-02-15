'use server';
import {ServerTools} from '@/task-definitions/server-tools';
import {ToolsBuilder} from '@/lib/tools-builder';
import {TaskDefinition} from '@/lib/task-definition';
import {DBAdminService} from '@/lib/db/db-admin-service';
import {redirect} from "next/navigation";
import { z } from "zod";

export async function getServerTools() {
  const builder = new ToolsBuilder();
  const result = builder.getCustomServerToolList();
  return result;
}


// export async function saveTaskDefinition(formData: FormData) {
//   const taskDefinition: TaskDefinition = {
//     id: formData.get('id') ? Number(formData.get('id')) : undefined,
//     isSystem: formData.get('isSystem') === 'true',
//     name: formData.get('name') as string,
//     description: formData.get('description') as string,
//     instructions: formData.get('instructions') as string,
//     serverToolIds: formData.getAll('serverToolIds') as string[],
//   };

//   // Save the task definition to the database
//   const db = new DBAdminService();
//   const result = await db.saveTaskDefinition(taskDefinition);

//   redirect("/admin");


//   // Revalidate the relevant path to reflect the new data
//   //revalidatePath('/admin');
// }

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
    serverToolIds: formData.getAll("serverToolIds") as string[],
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


// export async function saveTaskDefinitionAction(
//   _prevState: any,
//   formData: FormData
// ) {
//   const formObject = Object.fromEntries(formData.entries());
//   const result = taskDefinitionSchema.safeParse({
//     ...formObject,
//     serverToolIds: formObject.serverToolIds
//       ? (formObject.serverToolIds as string).split(",")
//       : [],
//     isSystem: formObject.isSystem === "true",
//   });

//   if (!result.success) {
//     const errors = result.error.flatten().fieldErrors;
//     return { errors, values: formObject };
//   }

//   const newTaskDefinition: TaskDefinition = result.data;

//   try {
//     const db = new DBAdminService();
//     const result = await db.saveTaskDefinition(newTaskDefinition);
//     return { success: true };
//   } catch (error) {
//     return { errors: { form: ["Failed to save task definition"] }, values: formObject };
//   }
// }


// export async function saveTaskDefinition(data: TaskDefinition) {
//   const db = new DBAdminService();
//   const result = await db.saveTaskDefinition(data);
//   //redirect("/admin");
// }

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


