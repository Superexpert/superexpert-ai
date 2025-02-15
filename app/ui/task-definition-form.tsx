"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import ListPicker from "@/app/admin/_components/list-picker";
import Link from "next/link";
import { TaskDefinition } from "@/lib/task-definition";
import { saveTaskDefinitionAction, deleteTaskDefinition } from "@/lib/server/admin-actions";

interface TaskDefinitionFormProps {
  taskDefinition: TaskDefinition;
  serverTools: { id: string; description: string }[];
  isEditMode: boolean;
}

export default function TaskDefinitionForm({
  taskDefinition,
  serverTools,
  isEditMode,
}: TaskDefinitionFormProps) {
  // const router = useRouter();
  // const [selectedToolIds, setSelectedToolIds] = useState<string[]>(
  //   taskDefinition.serverToolIds
  // );

  const [state, formAction, isPending] = useActionState(
    // async (prevState: any, formData: FormData) => {
    //   const newTaskDefinition: TaskDefinition = {
    //     ...taskDefinition,
    //     name: formData.get("name") as string,
    //     description: formData.get("description") as string,
    //     instructions: formData.get("instructions") as string,
    //     serverToolIds: formData.getAll("serverToolIds") as string[],
    //   };

    //   const result = await saveTaskDefinitionAction(newTaskDefinition);
    //   //router.push("/admin");
    //   return result; 
    // },
    saveTaskDefinitionAction,
    { values: taskDefinition, errors:{}, success: false }
  );

    const handleDelete = async () => {
        if (!taskDefinition.id) return;

        const confirmed = window.confirm("Are you sure you want to delete this task?");
        if (!confirmed) return;

        try {
            await deleteTaskDefinition(taskDefinition.id);
            //router.push("/admin"); // Redirect after delete
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };


  return (

    <div>
      <h1>{isEditMode ? "Edit Task Definition" : "New Task Definition"}</h1>

      {state.errors?.name}

      <form action={formAction} className="space-y-4">
        <div>
          <label>Task Name</label>
          {state.values?.name}
          <input
            type="text"
            name="name"
            readOnly={taskDefinition.isSystem}
            defaultValue={state.values?.name}
          />
          {state.errors?.name && (
            <p className="text-red-500">{state.errors.name}</p>
          )}
        </div>

        <div>
          <label>Description</label>
          {state.values?.description}
          <textarea
            name="description"
            readOnly={taskDefinition.isSystem}
            defaultValue={state.values?.description}
          ></textarea>
          {state.errors?.description && (
            <p className="text-red-500">{state.errors.description}</p>
          )}
        </div>

        <div>
          <label>Instructions</label>
          <textarea
            name="instructions"
            defaultValue={state.values?.instructions}
          ></textarea>
          {state.errors?.instructions && (
            <p className="text-red-500">{state.errors.instructions}</p>
          )}
        </div>

        <div>
          <label>Server Tools</label>
          <ListPicker
            className="bg-white max-h-24 overflow-y-scroll border border-gray-300 rounded-lg p-4"
            items={serverTools}
            selectedItemIds={selectedToolIds}
            onSelectionChange={setSelectedToolIds}
          />
        </div>

        <button className="btnPrimary" type="submit">
          Save
        </button>
        {isEditMode && !taskDefinition.isSystem && (
          <button
            className="btnDanger ml-4"
            type="button"
            onClick={handleDelete}
          >
            Delete
          </button>
        )}
        <Link href="/admin">
          <button className="btnCancel ml-4" type="button">
            Cancel
          </button>
        </Link>
      </form>
    </div>
  );
}


// "use client";

// import { useEffect, useState } from "react";
// import { useActionState } from "react";
// import { useRouter, useParams } from "next/navigation";
// import Link from "next/link";
// import ListPicker from "@/app/admin/_components/list-picker";
// import { getServerTools, getTaskDefinitionById, saveTaskDefinition, deleteTaskDefinition } from "@/lib/server/admin-actions";
// import { TaskDefinition } from "@/lib/task-definition";

// export default function TaskDefinitionForm() {
//     const router = useRouter();
//     const { id } = useParams(); // Extracts the ID from the URL if editing
//     const isEditMode = Boolean(id);

//     const [taskDefinition, setTaskDefinition] = useState<TaskDefinition>({
//         isSystem: false,
//         name: "",
//         description: "",
//         instructions: "",
//         serverToolIds: []
//     });

//     const [serverTools, setServerTools] = useState<{ id: string; description: string }[]>([]);

//     // Fetch task definition if in edit mode
//     useEffect(() => {
//         const fetchData = async () => {
//             const tools = await getServerTools();
//             setServerTools(tools);

//             if (isEditMode) {
//                 const existingTask = await getTaskDefinitionById(Number(id));
//                 setTaskDefinition(existingTask);
//             }
//         };

//         fetchData();
//     }, [id, isEditMode]);

//     const [state, formAction] = useActionState(
//         async (prevState: any, formData: FormData) => {
//             const newTaskDefinition: TaskDefinition = {
//                 id: isEditMode ? Number(id) : undefined, // Ensure ID is included when editing
//                 isSystem: taskDefinition.isSystem, 
//                 name: formData.get("name") as string,
//                 description: formData.get("description") as string,
//                 instructions: formData.get("instructions") as string,
//                 serverToolIds: formData.getAll("serverToolIds") as string[],
//             };

//             try {
//                 await saveTaskDefinition(newTaskDefinition);
//                 router.push("/admin"); // Redirect after save
//             } catch (error) {
//                 return { error: "Failed to save task definition" };
//             }
//         },
//         { error: "" }
//     );

//     const handleDelete = async () => {
//         if (!id) return;

//         const confirmed = window.confirm("Are you sure you want to delete this task?");
//         if (!confirmed) return;

//         try {
//             await deleteTaskDefinition(Number(id));
//             router.push("/admin"); // Redirect after delete
//         } catch (error) {
//             console.error("Failed to delete task", error);
//         }
//     };

//     const handleSelectionChange = (selectedIds: string[]) => {
//         setTaskDefinition((prev) => ({ ...prev, serverToolIds: selectedIds }));
//     };

//     return (
//         <div>
//             <h1>{isEditMode ? "Edit Task Definition" : "New Task Definition"}</h1>

//             {state?.error && <p className="text-red-500">{state.error}</p>}

//             <form action={formAction} className="space-y-4">
//                 <input type="hidden" name="id" value={id || ""} />

//                 <div>
//                     <label>Task Name</label>
//                     <input
//                         type="text"
//                         name="name"
//                         readOnly={taskDefinition.isSystem}
//                         value={taskDefinition.name}
//                         onChange={(e) => setTaskDefinition({ ...taskDefinition, name: e.target.value })}
//                         required
//                     />
//                 </div>

//                 <div>
//                     <label>Description</label>
//                     <textarea
//                         name="description"
//                         readOnly={taskDefinition.isSystem}
//                         value={taskDefinition.description}
//                         onChange={(e) => setTaskDefinition({ ...taskDefinition, description: e.target.value })}
//                     ></textarea>
//                 </div>


//                 <div>
//                     <label>Instructions</label>
//                     <textarea
//                         name="instructions"
//                         value={taskDefinition.instructions}
//                         onChange={(e) => setTaskDefinition({ ...taskDefinition, instructions: e.target.value })}
//                     ></textarea>
//                 </div>

//                 <div>
//                     <label>Server Tools</label>
//                     <ListPicker
//                         className="bg-white max-h-24 overflow-y-scroll border border-gray-300 rounded-lg p-4"
//                         items={serverTools}
//                         selectedItemIds={taskDefinition.serverToolIds}
//                         onSelectionChange={handleSelectionChange}
//                     />
//                 </div>

//                 <button className="btnPrimary" type="submit">Save</button>
//                 {isEditMode && !taskDefinition.isSystem && (
//                     <button 
//                         className="btnDanger ml-4"
//                         type="button"
//                         onClick={handleDelete}>
//                             Delete
//                     </button>
//                 )}
//                 <Link href="/admin">
//                     <button className="btnCancel ml-4" type="button">Cancel</button>
//                 </Link>
//             </form>
//         </div>
//     );
// }