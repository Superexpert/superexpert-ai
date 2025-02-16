"use client";

import { useActionState } from "react";
import ListPicker from "@/app/ui/list-picker";
import Link from "next/link";
import { TaskDefinition } from "@/lib/task-definition";
import { saveTaskDefinitionAction, deleteTaskDefinition } from "@/lib/server/admin-actions";

interface TaskDefinitionFormProps {
  taskDefinition: TaskDefinition;
  serverData: { id: string; description: string }[];
  serverTools: { id: string; description: string }[];
  clientTools: { id: string; description: string }[];
  isEditMode: boolean;
}

export default function TaskDefinitionForm({
  taskDefinition,
  serverData,
  serverTools,
  clientTools,
  isEditMode,
}: TaskDefinitionFormProps) {

  const [state, formAction, isPending] = useActionState(
    saveTaskDefinitionAction,
    { values: taskDefinition, errors:{}, success: false }
  );

    const handleDelete = async () => {
        if (!taskDefinition.id) return;
        const confirmed = window.confirm("Are you sure you want to delete this task?");
        if (!confirmed) return;

        try {
            await deleteTaskDefinition(taskDefinition.id);
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
          <label>Server Data</label>
          <ListPicker
            name="serverDataIds"
            className="bg-white max-h-24 overflow-y-scroll border border-gray-300 rounded-lg p-4"
            items={serverData}
            selectedItemIds={state.values?.serverDataIds || []}
          />
        </div>


        <div>
          <label>Server Tools</label>
          <ListPicker
            name="serverToolIds"
            className="bg-white max-h-24 overflow-y-scroll border border-gray-300 rounded-lg p-4"
            items={serverTools}
            selectedItemIds={state.values?.serverToolIds || []}
          />
        </div>

        <div>
          <label>Client Tools</label>
          <ListPicker
            name="clientToolIds"
            className="bg-white max-h-24 overflow-y-scroll border border-gray-300 rounded-lg p-4"
            items={clientTools}
            selectedItemIds={state.values?.clientToolIds || []}
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
