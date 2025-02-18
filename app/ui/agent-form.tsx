"use client";
import { useActionState } from "react";
import Link from "next/link";
import { saveAgentAction, deleteAgentAction } from "@/lib/server/admin-actions";
import { Agent } from "@/lib/agent";


export default function AgentForm({agent, isEditMode}: {agent: Agent, isEditMode: boolean}) {
  const [state, formAction, isPending] = useActionState(
    saveAgentAction,
    { values: agent, errors:{}, success: false }
  );

    const handleDelete = async () => {
        if (!agent.id) return;
        const confirmed = window.confirm("Are you sure you want to delete this agent?");
        if (!confirmed) return;

        try {
            await deleteAgentAction(agent.id);
        } catch (error) {
            console.error("Failed to delete agent", error);
        }
    };

  return (

    <div>
       <h1>{isEditMode ? "Edit Agent" : "New Agent"}</h1>

       {state.errors?.name}

       <form action={formAction} className="space-y-4">
         <div>
           <label>Task Name</label>
           {state.values?.name}
           <input
             type="text"
             name="name"
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
             defaultValue={state.values?.description}
           ></textarea>
           {state.errors?.description && (
             <p className="text-red-500">{state.errors.description}</p>
           )}
         </div>


         <button className="btnPrimary" type="submit">
           Save
         </button>
         {isEditMode && (
           <button
             className="btnDanger ml-4"
             type="button"
             onClick={handleDelete}
           >
             Delete
           </button>
         )}
         <Link href="/agent">
           <button className="btnCancel ml-4" type="button">
             Cancel
           </button>
         </Link>
       </form> 
    </div>
  );
}
