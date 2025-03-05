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
    const [maximumOutputTokensDescription, setMaximumOutputTokensDescription] = useState('');
    const [maximumTemperatureDescription, setMaximumTemperatureDescription] = useState('');

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
        const selectedModel = models.find(model => model.id === selectedModelId);
        if (selectedModel) {
          setMaximumOutputTokensDescription(`The ${selectedModel.name} model supports a maximum of ${selectedModel.maximumOutputTokens.toLocaleString()} tokens.`);
          setMaximumTemperatureDescription(`The ${selectedModel.name} model supports a maximum temperature of ${selectedModel.maximumTemperature.toFixed(1)}.`);
        } else {
          setMaximumOutputTokensDescription('Please select a model to see its maximum output tokens.');
          setMaximumTemperatureDescription('Please select a model to see its maximum temperature.');
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
        <div className="formCard">
            <h1>
                {isEditMode ? 'Edit Task Definition' : 'New Task Definition'}
            </h1>
            <div>
                sfjkjs fsfkl fsklkfsdksdkafkafs lfdsklkfsd fadskljkafsd
                afsklkflasdkfsadk fasd fas kjafsklf afsdklkjlafsd jlkfads
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    {serverError && <p className="error">{serverError}</p>}
                </div>
                <div>
                    <label>Task Name</label>
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
                    <textarea
                        {...register('description')}
                        readOnly={taskDefinition.isSystem}></textarea>
                    {errors.description && (
                        <p className="error">{errors.description.message}</p>
                    )}
                </div>

                <div>
                    <label>Instructions</label>
                    <textarea {...register('instructions')}></textarea>
                    {errors.instructions && (
                        <p className="error">{errors.instructions.message}</p>
                    )}
                </div>

                <h3>Server Data</h3>
                {serverData.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
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
                {serverTools.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
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
                {clientTools.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
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
                            global: Use the model from the global task definition
                        </label>
                    </div>
                )}
                {models.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
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

                <h3>Advanced AI Model Settings</h3>
                <div>
                    <label>Maximum Output Tokens</label>
                    <div>{maximumOutputTokensDescription}</div>
                    <input
                        {...register('maximumOutputTokens', {
                            setValueAs: (value) => (value === '' ? null : Number(value)),
                        })}
                        type="text"
                    />
                    {errors.maximumOutputTokens && (
                        <p className="error">{errors.maximumOutputTokens.message}</p>
                    )}
                </div>

                <div>
                    <label>Temperature</label>
                    <div>{maximumTemperatureDescription}</div>
                    <input
                        {...register('temperature', {
                            setValueAs: (value) => (value === '' ? null : Number(value)),
                        })}
                        type="text"
                    />
                    {errors.temperature && (
                        <p className="error">{errors.temperature.message}</p>
                    )}
                </div>


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
    );
}
