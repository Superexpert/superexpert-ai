'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { TaskDefinition, taskDefinitionSchema } from '@/lib/task-definition';
import {
    saveTaskDefinitionAction,
    deleteTaskDefinitionAction,
} from '@/lib/server/admin-actions';
import { ModelDefinition } from '@/lib/model-definition';
import DemoMode from '@/app/ui/demo-mode';

interface TaskDefinitionFormProps {
    agentId: string;
    agentName: string;
    taskDefinition: TaskDefinition;
    serverData: { id: string; description: string }[];
    serverTools: { id: string; description: string }[];
    clientTools: { id: string; description: string }[];
    models: ModelDefinition[];
    isEditMode: boolean;
}

export default function TaskDefinitionForm({
    agentId,
    agentName,
    taskDefinition,
    serverData,
    serverTools,
    clientTools,
    models,
    isEditMode,
}: TaskDefinitionFormProps) {
    const [serverError, setServerError] = useState('');
    const [maximumOutputTokensDescription, setMaximumOutputTokensDescription] =
        useState('');
    const [maximumTemperatureDescription, setMaximumTemperatureDescription] =
        useState('');

    const router = useRouter();
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<TaskDefinition>({
        resolver: zodResolver(taskDefinitionSchema),
        defaultValues: taskDefinition,
    });

    const selectedModelId = watch('modelId');

    useEffect(() => {
        const selectedModel = models.find(
            (model) => model.id === selectedModelId
        );
        if (selectedModel) {
            setMaximumOutputTokensDescription(
                `The ${
                    selectedModel.name
                } model supports a maximum of ${selectedModel.maximumOutputTokens.toLocaleString()} tokens.`
            );
            setMaximumTemperatureDescription(
                `The ${
                    selectedModel.name
                } model supports a maximum temperature of ${selectedModel.maximumTemperature.toFixed(
                    1
                )}.`
            );
        } else {
            setMaximumOutputTokensDescription(
                'Please select a model to see its maximum output tokens.'
            );
            setMaximumTemperatureDescription(
                'Please select a model to see its maximum temperature.'
            );
        }
    }, [selectedModelId, models]);

    const onSubmit = async (taskDefinition: TaskDefinition) => {
        const result = await saveTaskDefinitionAction(taskDefinition);
        if (result.success) {
            router.push(`/admin/${agentName}/task-definitions`);
        } else {
            setServerError(result.serverError);
        }
    };

    const handleDelete = async () => {
        if (!taskDefinition.id) return;
        const confirmed = window.confirm(
            'Are you sure you want to delete this task?'
        );
        if (!confirmed) return;

        try {
            await deleteTaskDefinitionAction(taskDefinition.id);
        } catch (error) {
            console.error('Failed to delete task', error);
        }
    };

    return (
        <>
            <DemoMode />

            <div className="formCard">
                <h1>
                    {isEditMode
                        ? 'Edit Task Definition'
                        : 'New Task Definition'}
                </h1>
                <div className="instructions">
                    A task definition provides the instructions, AI model, and
                    custom tools used by an agent. The global task provides
                    default values for these settings. The home task is always
                    the first task that an AI agent performs.
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        {serverError && <p className="error">{serverError}</p>}
                    </div>
                    <div>
                        <label>Task Name</label>
                        <div className="instructions">
                            An agent uses the task name to transition to a task.
                            The task name should be lower-case and a single word
                            with hyphens allowed.
                        </div>
                        <input
                            {...register('name')}
                            type="text"
                            readOnly={taskDefinition.isSystem}
                        />
                        {errors.name && (
                            <p className="error">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label>Description</label>
                        <div className="instructions">
                            The task description can be anything that you want.
                            Use the task description to describe the purpose of
                            the task.
                        </div>
                        <textarea
                            {...register('description')}
                            readOnly={taskDefinition.isSystem}></textarea>
                        {errors.description && (
                            <p className="error">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label>Instructions</label>
                        <div className="instructions">
                            The task instructions are for the AI agent. This is
                            where you perform your prompt engineering. These
                            instructions are given to the agent every time a
                            user prompts the agent while this task is active.
                            Instructions for individual tasks are combined with
                            the instructions from the global task.
                        </div>
                        <textarea {...register('instructions')}></textarea>
                        {errors.instructions && (
                            <p className="error">
                                {errors.instructions.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label>Start New Thread</label>
                        <div className="instructions">
                            Start a new message thread when the user starts this
                            task. Enabling this option will erase the agent's
                            memory of the previous messages in the conversation
                            when the user starts the new task.
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                className="checkbox"
                                id="startNewThread"
                                {...register('startNewThread')}
                            />
                            <label htmlFor="startNewThread">Enable</label>
                        </div>
                        {errors.startNewThread && (
                            <p className="error">
                                {errors.startNewThread.message}
                            </p>
                        )}
                    </div>

                    <h3>Server Data</h3>
                    <div className="instructions">
                        Load custom data from the server that is shared with the
                        agent. The server data can be anything that you want.
                        For example, load the current user's profile, your
                        company's vacation policies, or the latest product
                        catalog. Enabling a tool in the global task will enable
                        the tool for all tasks.
                    </div>
                    {serverData.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center space-x-2">
                            <input
                                className="checkbox"
                                type="checkbox"
                                id={`serverData-${item.id}`}
                                value={item.id}
                                {...register('serverDataIds')}
                            />
                            <label htmlFor={`serverData-${item.id}`}>
                                {item.description}
                            </label>
                        </div>
                    ))}

                    <h3>Server Tools</h3>
                    <div className="instructions">
                        Server tools are custom functions that an agent can
                        execute on the server. For example, update the user's
                        profile, send an email, or query a database. Enabling a
                        tool in the global task will enable the tool for all
                        tasks.
                    </div>
                    {serverTools.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center space-x-2">
                            <input
                                className="checkbox"
                                type="checkbox"
                                id={`serverTools-${item.id}`}
                                value={item.id}
                                {...register('serverToolIds')}
                            />
                            <label htmlFor={`serverTools-${item.id}`}>
                                {item.description}
                            </label>
                        </div>
                    ))}

                    <h3>Client Tools</h3>
                    <div className="instructions">
                        Client tools are custom functions that an agent can
                        execute on the client. For example, transition to a new
                        task or show a modal dialog. Enabling a tool in the
                        global task will enable the tool for all tasks.
                    </div>
                    {clientTools.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center space-x-2">
                            <input
                                className="checkbox"
                                type="checkbox"
                                id={`clientTools-${item.id}`}
                                value={item.id}
                                {...register('clientToolIds')}
                            />
                            <label htmlFor={`clientTools-${item.id}`}>
                                {item.description}
                            </label>
                        </div>
                    ))}

                    <h3>AI Model</h3>
                    <div className="instructions">
                        Select the AI model that the agent will use for this
                        task. The global task model is used when the task model
                        is set to 'global'.
                    </div>
                    {taskDefinition.name != 'global' && (
                        <div className="flex items-center space-x-2">
                            <input
                                className="checkbox"
                                type="radio"
                                id="model-global"
                                value="global"
                                {...register('modelId')}
                            />
                            <label htmlFor="model-global">
                                global: Use the model from the global task
                                definition
                            </label>
                        </div>
                    )}
                    {models.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center space-x-2">
                            <input
                                className="checkbox"
                                type="radio"
                                id={`model-${item.id}`}
                                value={item.id}
                                {...register('modelId')}
                            />
                            <label htmlFor={`model-${item.id}`}>
                                {item.name}:{item.description}
                            </label>
                        </div>
                    ))}

                    {selectedModelId !== 'global' && (
                        <>
                            <h3>Advanced AI Model Settings</h3>
                            <div className="instructions">
                                The advanced AI model settings allow you to
                                customize the AI model's behavior.
                            </div>

                            <label>Maximum Output Tokens</label>
                            <div className="instructions">
                                The maximum output tokens setting cuts off the
                                number of tokens that the AI model can generate.
                                This setting is useful for preventing the AI
                                model from generating too much text.
                            </div>

                            <div className="instructions">
                                {maximumOutputTokensDescription}
                            </div>
                            <input
                                {...register('maximumOutputTokens', {
                                    setValueAs: (value) =>
                                        !value ? null : Number(value),
                                })}
                                type="number"
                            />
                            {errors.maximumOutputTokens && (
                                <p className="error">
                                    {errors.maximumOutputTokens.message}
                                </p>
                            )}

                            <div>
                                <label>Temperature</label>
                                <div className="instructions">
                                    The temperature setting controls the
                                    randomness of the AI model's output. A
                                    higher temperature will produce more random
                                    output.
                                </div>
                                <div className="instructions">
                                    {maximumTemperatureDescription}
                                </div>
                                <input
                                    {...register('temperature', {
                                        setValueAs: (value) =>
                                            !value ? null : Number(value),
                                    })}
                                    type="number"
                                    step="0.01"
                                />
                                {errors.temperature && (
                                    <p className="error">
                                        {errors.temperature.message}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <button className="btn btnPrimary" type="submit">
                        Save
                    </button>
                    {isEditMode && !taskDefinition.isSystem && (
                        <button
                            className="btn btnDanger ml-4"
                            type="button"
                            onClick={handleDelete}>
                            Delete
                        </button>
                    )}
                    <Link href={`/admin/${agentName}/task-definitions`}>
                        <button className="btn btnCancel ml-4" type="button">
                            Cancel
                        </button>
                    </Link>
                </form>
            </div>
        </>
    );
}
