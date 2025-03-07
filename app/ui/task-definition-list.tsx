import Link from 'next/link';
import DemoMode from '@/app/ui/demo-mode';

export default function TaskDefinitionList({
    agentName,
    taskDefinitions,
}: {
    agentName: string;
    taskDefinitions: { id: string; name: string; description: string }[];
}) {
    return (
        <>
        <DemoMode />
        <div className="formCard">
            <h1>Task Definitions</h1>
            <p className="instructions">
                Task definitions are the instructions that the AI will follow to
                complete a task.
            </p>

            <div className="space-y-4">
                {taskDefinitions.map((td) => (
                    <div
                        key={td.id}
                        className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
                        <div>
                            <span className="text-lg">{td.name}</span>
                            <br />
                            <span>{td.description}</span>
                        </div>
                        <Link
                            href={`/admin/${agentName}/task-definitions/edit/${td.id}`}
                            className="btn btnSecondary">
                            Edit
                        </Link>
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <Link
                    href={`/admin/${agentName}/task-definitions/edit/`}
                    className="btn btnPrimary">
                    New Task Definition
                </Link>
                <Link href={`/`} className="btn btnCancel ml-4">
                    Cancel
                </Link>
            </div>
        </div>
        </>
    );
}
