'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { saveAgentAction, deleteAgentAction } from '@/lib/server/admin-actions';
import { Agent, agentSchema } from '@/lib/agent';
import DemoMode from '@/app/ui/demo-mode';

export default function AgentForm({
    agent,
    isEditMode,
}: {
    agent: Agent;
    isEditMode: boolean;
}) {
    const [serverError, setServerError] = useState('');
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Agent>({
        resolver: zodResolver(agentSchema),
        defaultValues: agent,
    });

    const onSubmit = async (newAgent: Agent) => {
        const result = await saveAgentAction(newAgent);
        if (result.success) {
            router.push('/');
        } else {
            setServerError(result.serverError);
        }
    };

    const handleDelete = async () => {
        if (!agent.id) return;
        const confirmed = window.confirm(
            'Are you sure you want to delete this agent?'
        );
        if (!confirmed) return;

        try {
            await deleteAgentAction(agent.id);
        } catch (error) {
            console.error('Failed to delete agent', error);
        }
    };

    return (
        <>
        <DemoMode />

        <div className="formCard">
            <h1>{isEditMode ? 'Edit Agent' : 'New Agent'}</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    {serverError && <p className="error">{serverError}</p>}
                </div>

                <div>
                    <label>Agent Name</label>
                    <input type="text" {...register('name')} />
                    {errors.name && (
                        <p className="error">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label>Agent Description</label>
                    <textarea {...register('description')}></textarea>
                    {errors.description && (
                        <p className="error">{errors.description.message}</p>
                    )}
                </div>

                <button className="btn btnPrimary" type="submit">
                    Save
                </button>
                {isEditMode && (
                    <button
                        className="btn btnDanger ml-4"
                        type="button"
                        onClick={handleDelete}>
                        Delete
                    </button>
                )}
                <Link href="/">
                    <button className="btn btnCancel ml-4" type="button">
                        Cancel
                    </button>
                </Link>
            </form>
        </div>
        </>
    );
}
