import Link from 'next/link';
import BackButton from '@/app/(admin)/ui/back-button';
import DemoMode from '@/app/(admin)/ui/demo-mode';

export default function TaskDefinitionList({
    agentName,
    taskDefinitions,
}: {
    agentName: string;
    taskDefinitions: { id: string; name: string; description: string }[];
}) {
    return (
        <>
            <div className="pageContainer">
                <DemoMode />

                <div className="mb-4">
                    <BackButton backUrl="/" />
                </div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="pageHeader">{agentName} Tasks</h1>
                        <p className="text-gray-600">
                            A task provides the instructions, AI model, and
                            custom tools used by an agent.
                        </p>
                    </div>
                    <Link
                        href={`/admin/${agentName}/task-definitions/edit/`}
                        className="btnPrimary text-nowrap">
                        <span className="inline sm:hidden">New</span>
                        <span className="hidden sm:inline">New task</span>
                    </Link>
                </div>

                <div className="pageCard">
                    {taskDefinitions.map((td) => (
                        <div
                            key={td.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                            <div className="flex-1">
                                <h2 className="text-base font-bold text-neutral-900">
                                    {td.name}
                                </h2>
                                <p className="mt-1 text-gray-500 text-sm leading-snug">
                                    {td.description}
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-0">
                                <Link
                                    href={`/admin/${agentName}/task-definitions/edit/${td.id}`}
                                    className="btnSecondary">
                                    Edit
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
