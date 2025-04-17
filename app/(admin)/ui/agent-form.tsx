'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
    saveAgentAction,
    deleteAgentAction,
} from '@/lib/actions/admin-actions';
import { Agent, agentSchema } from '@/lib/agent';
import DemoMode from '@/app/(admin)/ui/demo-mode';
import { FormField } from '@/app/(admin)/ui/form-field';

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

            <div className="pageContainer">
                <DemoMode />
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="pageHeader">
                            {isEditMode ? 'Edit Agent' : 'New Agent'}
                        </h1>
                        <p className="text-gray-600">
                            An agent performs a set of tasks. For example, you
                            can create a &apos;customer-service&apos; agent to
                            handle customer inquiries or a
                            &apos;marketing-assistant&apos; agent to help
                            develop marketing content.
                        </p>
                    </div>
                </div>

                <form className="pageCard" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        {serverError && <p className="error">{serverError}</p>}
                    </div>

                    <FormField
                        label="Agent Name"
                        htmlFor="name"
                        error={errors.name?.message}
                        instructions="The agent name should be lower-case and a single word with hyphens allowed.">
                        <input id="name" type="text" {...register('name')} />
                    </FormField>

                    <FormField
                        label="Agent Description"
                        htmlFor="description"
                        error={errors.description?.message}
                        instructions="Describe the purpose of the agent.">
                        <textarea
                            id="description"
                            {...register('description')}
                        />
                    </FormField>
                    <div className="flex gap-4 mt-10 pt-4 border-t border-neutral-100">
                        <button className="btnPrimary" type="submit">
                            Save
                        </button>
                        {isEditMode && (
                            <button
                                className="btnDanger"
                                type="button"
                                onClick={handleDelete}>
                                Delete
                            </button>
                        )}
                        <Link href="/">
                            <button className="btnSecondary" type="button">
                                Cancel
                            </button>
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
