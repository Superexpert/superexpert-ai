'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { TaskDefinition, clientTaskDefinitionSchema } from '@/lib/task-definition';
import {
    saveTaskDefinitionAction,
    deleteTaskDefinitionAction,
    saveAttachmentAction,
    deleteAttachmentAction,
} from '@/lib/actions/admin-actions';
import { LLMModelDefinition } from '@superexpert-ai/superexpert-ai-plugins';
import DemoMode from '@/app/ui/demo-mode';
import React, { ChangeEvent } from 'react';
import '@/superexpert-ai.plugins.client';
import {getThemes} from '@superexpert-ai/superexpert-ai-plugins'; 

interface TaskDefinitionFormProps {
    agentId: string;
    agentName: string;
    taskDefinition: TaskDefinition;
    attachments: { id: string; fileName: string }[];
    corpora: { id: string; name: string; description: string }[];
    serverData: { id: string; description: string }[];
    serverTools: { id: string; description: string }[];
    clientTools: { id: string; description: string }[];
    llmModels: LLMModelDefinition[];
    isEditMode: boolean;
}

export default function TaskDefinitionForm({
    agentName,
    taskDefinition,
    attachments,
    corpora,
    serverData,
    serverTools,
    clientTools,
    llmModels,
    isEditMode,
}: TaskDefinitionFormProps) {
    const [serverError, setServerError] = useState('');
    const [currentAttachments, setCurrentAttachments] = useState(attachments);
    const [maximumOutputTokensDescription, setMaximumOutputTokensDescription] =
        useState('');
    const [maximumTemperatureDescription, setMaximumTemperatureDescription] =
        useState('');

    const router = useRouter();

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const themes = getThemes();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<TaskDefinition>({
        resolver: zodResolver(clientTaskDefinitionSchema),
        defaultValues: taskDefinition,
    });

    const selectedModelId = watch('modelId');

    useEffect(() => {
        const selectedModel = llmModels.find(
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
    }, [selectedModelId, llmModels]);

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

    const handleUploadAttachment = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            const fileName = file.name;
            const validTypes = ['text/plain', 'application/json', 'text/csv'];

            if (validTypes.includes(file.type)) {
                // Check if it's a text file
                const reader = new FileReader();

                reader.onload = async (e) => {
                    const text = e.target?.result as string; // Get the file content as a string
                    // Now you can store the 'text' variable in your database.
                    const attachmentId = await saveAttachmentAction(
                        taskDefinition.id!,
                        fileName,
                        text
                    );
                    setCurrentAttachments((prevAttachments) => [
                        ...prevAttachments,
                        { id: attachmentId, fileName },
                    ]);
                };

                reader.onerror = (error) => {
                    console.error('Error reading file:', error);
                };

                reader.readAsText(file); // Read the file as text
            } else {
                console.error('Selected file is not a text file.');
            }
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        await deleteAttachmentAction(attachmentId);
        setCurrentAttachments((prevAttachments) =>
            prevAttachments.filter(
                (attachment) => attachment.id !== attachmentId
            )
        );
    };

    return (
        <>
            <DemoMode />

            <div className="formCard">
                <div>
                    <Link href={`/admin/${agentName}/task-definitions`}>&lt; Back</Link>
                </div>

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
                        <h2>Task Name</h2>
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
                        <h2>Description</h2>
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
                        <h2>Instructions</h2>
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
                        <h2>Theme</h2>
                        <label>Theme</label>
                        <div className="instructions">
                            The theme determines the appearance of your chat
                            bot.
                        </div>
                        {taskDefinition.name != 'global' && (
                            <div className="flex items-center space-x-2">
                                <input
                                    className="checkbox"
                                    type="radio"
                                    id="theme-global"
                                    value="global"
                                    {...register('theme')}
                                />
                                <label htmlFor="theme-global">
                                    global: Use the theme from the global task
                                    definition
                                </label>
                            </div>
                        )}
                        {themes.map((theme) => (
                            <div
                                key={theme.id}
                                className="flex items-center space-x-2">
                                <input
                                    className="checkbox"
                                    type="radio"
                                    id={theme.id}
                                    value={theme.id}
                                    {...register('theme')}
                                />
                                <label htmlFor={`${theme.id}`}>
                                    {theme.name}
                                </label>
                            </div>
                        ))}
                        {errors.theme && (
                            <p className="error">{errors.theme.message}</p>
                        )}
                    </div>

                    <div>
                        <h2>Start New Thread</h2>
                        <label>Start New Thread</label>
                        <div className="instructions">
                            Start a new message thread when the user starts this
                            task. Enabling this option will erase the
                            agent&apos;s memory of the previous messages in the
                            conversation when the user starts the new task.
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

                    <h2>Attachments</h2>
                    <div className="instructions">
                        Attach one or more files to this task.
                    </div>
                    {currentAttachments.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center space-x-2">
                            {item.fileName}
                            <button
                                type="button"
                                className="ml-4 btn btnSmall btnDanger"
                                onClick={() => handleDeleteAttachment(item.id)}>
                                Delete
                            </button>
                        </div>
                    ))}
                    <div>
                        <input
                            type="file"
                            accept=".txt,application/json,text/csv"
                            form="none"
                            onChange={handleUploadAttachment}
                            disabled={isDemoMode}
                        />

                        <DemoMode text="In Demo Mode, attachments are disabled." />
                    </div>

                    <h2>Retrieval Augmented Generation</h2>
                    <div className="instructions">
                        Retrieval Augmented Generation augments each user chat
                        message with text chunks retrieved from a corpus.
                    </div>
                    <div>
                        <label>Corpus Limit</label>
                        <div className="instructions">
                            The maximum number of text chunks to retrieve from
                            the corpus.
                        </div>
                        <input
                            type="number"
                            placeholder="Limit"
                            {...register(`corpusLimit`, {
                                valueAsNumber: true,
                            })}
                        />
                    </div>
                    <div>
                        <label>Corpus Similarity Threshold</label>
                        <div className="instructions">
                            Results are only returned if the similarity score
                            between the user message and the corpus text is
                            above this threshold.
                        </div>
                        <input
                            type="number"
                            placeholder="Threshold"
                            {...register(`corpusSimilarityThreshold`, {
                                valueAsNumber: true,
                            })}
                        />
                    </div>
                    {corpora.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center space-x-2">
                            <input
                                className="checkbox"
                                type="checkbox"
                                id={`corpus-${item.id}`}
                                value={item.id}
                                {...register('corpusIds')}
                            />
                            <label htmlFor={`corpus-${item.id}`}>
                                {item.name} {item.description}
                            </label>
                        </div>
                    ))}

                    <h2>Server Data Tools</h2>
                    <div className="instructions">
                        Load custom data from the server that is shared with the
                        agent. The server data can be anything that you want.
                        For example, load the current user&apos;s profile, your
                        company&apos;s vacation policies, or the latest product
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

                    <h2>Server Tools</h2>
                    <div className="instructions">
                        Server tools are custom functions that an agent can
                        execute on the server. For example, update the
                        user&apos;s profile, send an email, or query a database.
                        Enabling a tool in the global task will enable the tool
                        for all tasks.
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

                    <h2>Client Tools</h2>
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

                    <h2>AI Model</h2>
                    <div className="instructions">
                        Select the AI model that the agent will use for this
                        task. The global task model is used when the task model
                        is set to &apos;global&apos;.
                    </div>
                    <DemoMode text="In Demo Mode, you can only use GPT-4o mini." />

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
                    {llmModels.map((item) => (
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
                            <h2>Advanced AI Model Settings</h2>
                            <div className="instructions">
                                The advanced AI model settings allow you to
                                customize the AI model&apos;s behavior.
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
                                    randomness of the AI model&apos;s output. A
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
