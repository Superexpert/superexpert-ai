import Link from 'next/link';
import DemoMode from '@/app/ui/demo-mode';

export default function AgentList({
    agents,
}: {
    agents: { id: string; name: string; description: string }[];
}) {
    return (
        <>
            <div className="pageContainer">
                <DemoMode />

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="pageHeader">Agents</h1>
                        <p className="text-gray-600">
                            Manage your team of Superexpert.AI agents.
                        </p>
                    </div>
                    <Link href="/admin/agents" className="btnPrimary">
                        <span className="inline sm:hidden">New</span>
                        <span className="hidden sm:inline">New agent</span>
                    </Link>
                </div>

                <div className="pageCard">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2 sm:gap-y-0 p-4 rounded-xl bg-white shadow-sm">
                            <div className="flex-1">
                                <h2 className="text-base font-bold text-neutral-900">
                                    {agent.name}
                                </h2>
                                <p className="mt-1 text-gray-500 text-sm leading-snug">
                                    {agent.description}
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-0 flex space-x-2">
                                <Link
                                    href={`/admin/agents/${agent.id}`}
                                    className="btnSecondary">
                                    Edit
                                </Link>
                                <Link
                                    href={`/admin/${agent.name}/task-definitions`}
                                    className="btnSecondary">
                                    Tasks
                                </Link>
                                <Link
                                    href={`${agent.name}`}
                                    target="_blank"
                                    className="btnSecondary">
                                    Chat
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
