/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect } from 'react';
import BackButton from '@/app/(admin)/ui/back-button';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
    TaskDefinition,
    clientTaskDefinitionSchema,
} from '@/lib/task-definition';
import {
    saveTaskDefinitionAction,
    deleteTaskDefinitionAction,
    saveAttachmentAction,
    deleteAttachmentAction,
} from '@/lib/actions/admin-actions';
import { LLMModelDefinition } from '@superexpert-ai/framework';
import DemoMode from '@/app/(admin)/ui/demo-mode';
import React, { ChangeEvent } from 'react';
import '@/superexpert-ai.plugins.client';
import { getThemeList } from '@superexpert-ai/framework';
import { CollapsiblePanel } from './collapsible-panel';
import { FormField } from './form-field';
import LockIcon from '@/app/(admin)/ui/lock-icon';
import { cn } from '@/lib/utils/cn';
import { SelectableCard } from './selectable-card';

interface toolItem {
    id: string;
    description: string;
    category?: string;
}

interface TaskDefinitionFormProps {
    agentId: string;
    agentName: string;
    taskDefinition: TaskDefinition;
    attachments: { id: string; fileName: string }[];
    corpora: { id: string; name: string; description: string }[];
    contextTools: toolItem[];
    serverTools: toolItem[];
    clientTools: toolItem[];
    llmModels: LLMModelDefinition[];
    isEditMode: boolean;
}

export default function TaskDefinitionForm({
    agentName,
    taskDefinition,
    attachments,
    corpora,
    contextTools,
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
    const themes = getThemeList();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
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
            <div className="pageContainer">
                <DemoMode />

                {/* Back Link */}
                <div className="mb-4">
                    <BackButton
                        backUrl={`/admin/${agentName}/task-definitions`}
                    />
                </div>

                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="pageHeader">
                            {isEditMode
                                ? 'Edit Task Definition'
                                : 'New Task Definition'}
                        </h1>
                        <p className="text-gray-600 max-w-3xl mt-2">
                            A task provides the instructions, AI model, and
                            custom tools used by an agent.
                        </p>
                    </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        {serverError && <p className="error">{serverError}</p>}
                    </div>

                    <CollapsiblePanel title="General" openByDefault={true}>
                        <FormField
                            label="Task Name"
                            htmlFor="name"
                            error={errors.name?.message}
                            instructions="An agent uses the task name to transition to a
                                task. The task name should be lower-case and a
                                single word with hyphens allowed.">
                            {taskDefinition.isSystem ? (
                                <div className="relative">
                                    <input
                                        id="name"
                                        type="text"
                                        readOnly
                                        {...register('name')}
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <LockIcon />
                                    </div>
                                </div>
                            ) : (
                                <input
                                    id="name"
                                    type="text"
                                    {...register('name')}
                                />
                            )}
                        </FormField>

                        <FormField
                            label="Task Description"
                            htmlFor="description"
                            error={errors.description?.message}
                            instructions="The task description can be anything that you
                                want. Use the task description to describe the
                                purpose of the task.">
                            {taskDefinition.isSystem ? (
                                <div className="relative">
                                    <textarea
                                        id="description"
                                        readOnly
                                        {...register('description')}
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <LockIcon />
                                    </div>
                                </div>
                            ) : (
                                <textarea
                                    id="description"
                                    {...register('description')}
                                />
                            )}
                        </FormField>

                        <FormField
                            label="Task Instructions"
                            htmlFor="instructions"
                            error={errors.instructions?.message}
                            instructions="The task instructions are for the AI agent. This
                                is where you perform your prompt engineering.
                                These instructions are given to the agent every
                                time a user prompts the agent while this task is
                                active. Instructions for individual tasks are
                                combined with the instructions from the global
                                task.">
                            <textarea
                                id="instructions"
                                {...register('instructions')}></textarea>
                        </FormField>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="Messages">
                        <FormField
                            label="Start New Thread"
                            htmlFor="startNewThread"
                            type="checkbox"
                            error={errors.startNewThread?.message}
                            instructions="Start a new message thread when the user starts this task. Enabling this option will erase the agent’s memory of the previous messages in the conversation when the user starts the new task.">
                            <input
                                type="checkbox"
                                id="startNewThread"
                                {...register('startNewThread')}
                            />
                        </FormField>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="AI Model">
                        {taskDefinition.name !== 'global' && (
                            <div className="mt-6">
                                <label
                                    htmlFor="model-global"
                                    className={cn(
                                        'flex items-start gap-3 p-4 border border-gray-200 rounded-2xl cursor-pointer hover:border-gray-300 hover:bg-gray-50',
                                        watch('modelId') === 'global' &&
                                            'border-orange-500 bg-orange-50'
                                    )}>
                                    <input
                                        type="radio"
                                        id="model-global"
                                        value="global"
                                        {...register('modelId')}
                                        className="mt-1 h-4 w-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            global
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Use the model from the global task
                                            definition
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            {llmModels.map((model) => (
                                <SelectableCard
                                    key={model.id}
                                    id={`model-${model.id}`}
                                    name={model.name}
                                    description={model.description}
                                    provider={model.provider}
                                    value={model.id}
                                    type="radio"
                                    selected={watch('modelId') === model.id}
                                    onChange={() =>
                                        setValue('modelId', model.id)
                                    }
                                />
                            ))}
                        </div>

                        {selectedModelId !== 'global' && (
                            <div className="mt-6">
                                <FormField
                                    label="Maximum Output Tokens"
                                    htmlFor="maximumOutputTokens"
                                    error={errors.maximumOutputTokens?.message}
                                    instructions="The maximum output tokens setting cuts off
                                    the number of tokens that the AI model can
                                    generate. This setting is useful for
                                    preventing the AI model from generating too
                                    much text."
                                    additionalInstructions={
                                        maximumOutputTokensDescription
                                    }>
                                    <input
                                        {...register('maximumOutputTokens', {
                                            setValueAs: (value) =>
                                                !value ? null : Number(value),
                                        })}
                                        type="number"
                                    />
                                </FormField>

                                <FormField
                                    label="Temperature"
                                    htmlFor="temperature"
                                    error={errors.temperature?.message}
                                    instructions="The temperature setting controls the
                                        randomness of the AI model's
                                        output. A higher temperature will
                                        produce more random output."
                                    additionalInstructions={
                                        maximumTemperatureDescription
                                    }>
                                    <input
                                        {...register('temperature', {
                                            setValueAs: (value) =>
                                                !value ? null : Number(value),
                                        })}
                                        type="number"
                                        step="0.01"
                                    />
                                </FormField>
                            </div>
                        )}
                    </CollapsiblePanel>

                    <CollapsiblePanel title="Tools">
                        <h2 className="text-lg font-semibold text-neutral-900 mt-8 mb-2">
                            Server Tools
                        </h2>
                        <p className="instructions mb-4">
                            Server tools are custom functions that an agent can
                            execute on the server. For example, update the
                            user&apos;s profile, send an email, or query a
                            database. Enabling a tool in the global task will
                            enable the tool for all tasks.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {serverTools.map((tool) => {
                                const isSelected = (
                                    watch('serverToolIds') || []
                                ).includes(tool.id);

                                return (
                                    <SelectableCard
                                        key={tool.id}
                                        id={`serverTool-${tool.id}`}
                                        name={`${tool.id} ${
                                            tool.category
                                                ? `(${tool.category})`
                                                : ''
                                        }`}
                                        description={tool.description}
                                        type="checkbox"
                                        value={tool.id}
                                        selected={isSelected}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            const current =
                                                watch('serverToolIds') || [];
                                            const updated = checked
                                                ? [...current, tool.id]
                                                : current.filter(
                                                      (id) => id !== tool.id
                                                  );
                                            setValue('serverToolIds', updated);
                                        }}
                                    />
                                );
                            })}
                        </div>

                        <hr className="my-6 border-t border-gray-200" />

                        <h2 className="text-lg font-semibold text-neutral-900 mt-8 mb-2">
                            Client Tools
                        </h2>
                        <p className="instructions mb-4">
                            Client tools are custom functions that an agent can
                            execute on the client. For example, transition to a
                            new task or show a modal dialog.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {clientTools.map((tool) => {
                                const isSelected = (
                                    watch('clientToolIds') || []
                                ).includes(tool.id);

                                return (
                                    <SelectableCard
                                        key={tool.id}
                                        id={`clientTool-${tool.id}`}
                                        name={`${tool.id} ${
                                            tool.category
                                                ? `(${tool.category})`
                                                : ''
                                        }`}
                                        description={tool.description}
                                        type="checkbox"
                                        value={tool.id}
                                        selected={isSelected}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            const current =
                                                watch('clientToolIds') || [];
                                            const updated = checked
                                                ? [...current, tool.id]
                                                : current.filter(
                                                      (id) => id !== tool.id
                                                  );
                                            setValue('clientToolIds', updated);
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="Context Data">
                        <h2 className="text-lg font-semibold text-neutral-900 mt-8 mb-2">
                            Attachments
                        </h2>
                        <p className="instructions mb-4">
                            Attach one or more files to this task.
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {currentAttachments.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-800">
                                    <span className="truncate max-w-[180px]">
                                        {file.fileName}
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleDeleteAttachment(file.id)
                                        }
                                        type="button"
                                        className="ml-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium px-3 py-1 rounded-full transition">
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>

                        {isDemoMode ? (
                            <div className="p-4 bg-gray-100 border border-gray-200 rounded-md">
                                <p className="text-sm text-gray-700">
                                    Demo mode enabled: File uploads are
                                    disabled.
                                </p>
                            </div>
                        ) : (
                            <label className="inline-flex items-center mt-4 cursor-pointer">
                                <span className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 transition">
                                    Choose File
                                </span>
                                <input
                                    type="file"
                                    accept=".txt,application/json,text/csv"
                                    onChange={handleUploadAttachment}
                                    className="hidden"
                                />
                            </label>
                        )}
                        <h2 className="text-lg font-semibold text-neutral-900 mt-8 mb-2">
                            Retrieval Augmented Generation
                        </h2>
                        <p className="instructions mb-4">
                            Retrieval Augmented Generation augments each user
                            chat message with text chunks retrieved from a
                            corpus.
                        </p>

                        {corpora.length > 0 ? (
                            <>
                                {/* Chunk Settings */}
                                <FormField
                                    label="Corpus Limit"
                                    htmlFor="corpusLimit"
                                    error={errors.corpusLimit?.message}
                                    instructions="The maximum number of text chunks to retrieve from the corpus.">
                                    <input
                                        id="corpusLimit"
                                        type="number"
                                        placeholder="Limit"
                                        {...register(`corpusLimit`, {
                                            valueAsNumber: true,
                                        })}
                                    />
                                </FormField>

                                <FormField
                                    label="Corpus Similarity Threshold"
                                    htmlFor="corpusSimilarityThreshold"
                                    error={
                                        errors.corpusSimilarityThreshold
                                            ?.message
                                    }
                                    instructions="Results are only returned if the similarity score between the user message and the corpus text is above this threshold.">
                                    <input
                                        id="corpusSimilarityThreshold"
                                        type="number"
                                        placeholder="Threshold"
                                        {...register(
                                            `corpusSimilarityThreshold`,
                                            { valueAsNumber: true }
                                        )}
                                    />
                                </FormField>

                                {/* Corpus Selection */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    {corpora.map((corpus) => {
                                        const isSelected = (
                                            watch('corpusIds') || []
                                        ).includes(corpus.id);
                                        return (
                                            <SelectableCard
                                                key={corpus.id}
                                                id={`corpus-${corpus.id}`}
                                                name={corpus.name}
                                                description={corpus.description}
                                                type="checkbox"
                                                value={corpus.id}
                                                selected={isSelected}
                                                onChange={(e) => {
                                                    const checked =
                                                        e.target.checked;
                                                    const current =
                                                        watch('corpusIds') ||
                                                        [];
                                                    const updated = checked
                                                        ? [
                                                              ...current,
                                                              corpus.id,
                                                          ]
                                                        : current.filter(
                                                              (id) =>
                                                                  id !==
                                                                  corpus.id
                                                          );
                                                    setValue(
                                                        'corpusIds',
                                                        updated
                                                    );
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm">
                                No corpora defined. Please upload a corpus file
                                before enabling RAG.
                            </div>
                        )}

                        <h2 className="text-lg font-semibold text-neutral-900 mt-8 mb-2">
                            Context Tools
                        </h2>
                        <p className="instructions mb-4">
                            Load custom data from the server that is shared with
                            the agent. The server data can be anything that you
                            want. For example, load the current user&apos;s
                            profile, your company&apos;s vacation policies, or
                            the latest product catalog. Enabling a tool in the
                            global task will enable the tool for all tasks.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {contextTools.map((tool) => {
                                const isSelected = (
                                    watch('contextToolIds') || []
                                ).includes(tool.id);

                                return (
                                    <SelectableCard
                                        key={tool.id}
                                        id={`contextTool-${tool.id}`}
                                        name={`${tool.id} ${
                                            tool.category
                                                ? `(${tool.category})`
                                                : ''
                                        }`}
                                        description={tool.description}
                                        type="checkbox"
                                        value={tool.id}
                                        selected={isSelected}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            const current =
                                                watch('contextToolIds') || [];
                                            const updated = checked
                                                ? [...current, tool.id]
                                                : current.filter(
                                                      (id) => id !== tool.id
                                                  );
                                            setValue('contextToolIds', updated);
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="Theme">
                        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
                            Theme
                        </h2>
                        <p className="instructions mb-4">
                            The theme determines the appearance of your chat
                            bot.
                        </p>

                        {taskDefinition.name !== 'global' && (
                            <div className="mb-6">
                                <label
                                    htmlFor="theme-global"
                                    className={cn(
                                        'flex items-start gap-3 p-4 border border-gray-200 rounded-2xl cursor-pointer hover:border-gray-300 hover:bg-gray-50',
                                        watch('theme') === 'global' &&
                                            'border-orange-500 bg-orange-50'
                                    )}>
                                    <input
                                        type="radio"
                                        id="theme-global"
                                        value="global"
                                        {...register('theme')}
                                        className="mt-1 h-4 w-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            global
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Use the theme from the global task
                                            definition
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {themes.map((theme) => {
                                const selected = watch('theme') === theme.id;

                                return (
                                    <label
                                        key={theme.id}
                                        htmlFor={theme.id}
                                        className={cn(
                                            'relative cursor-pointer rounded-2xl border p-4 transition',
                                            selected
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        )}>
                                        {/* ✅ Selection Checkmark */}
                                        {selected && (
                                            <div className="absolute top-2 right-2 text-orange-500">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414L8.414 15 4.293 10.879a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        )}

                                        {/* 📷 Theme Image */}
                                        <img
                                            src={theme.imagePreview}
                                            alt={`${theme.id} preview`}
                                            className="w-full h-24 object-contain mb-4"
                                        />

                                        {/* 🔘 Hidden Radio Input */}
                                        <input
                                            type="radio"
                                            id={theme.id}
                                            value={theme.id}
                                            {...register('theme')}
                                            className="hidden"
                                        />

                                        {/* 📋 Label + Description */}
                                        <div className="text-sm font-semibold text-gray-900">
                                            {theme.name}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-0.5">
                                            {theme.description}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </CollapsiblePanel>

                    <div>
                        <button className="btnPrimary" type="submit">
                            Save
                        </button>
                        {isEditMode && !taskDefinition.isSystem && (
                            <button
                                className="btnDanger ml-4"
                                type="button"
                                onClick={handleDelete}>
                                Delete
                            </button>
                        )}
                        <Link href={`/admin/${agentName}/task-definitions`}>
                            <button className="btnSecondary ml-4" type="button">
                                Cancel
                            </button>
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
