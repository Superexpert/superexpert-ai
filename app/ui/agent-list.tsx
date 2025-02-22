import Link from "next/link";


export default function AgentList(
    { agents }: { agents: { id: string; name: string; description: string; }[] }
) {
    return (
        <div className="formCard">
            <h1 className="mb-4">Agents</h1>
            <p className="text-gray-600 mb-6">
                Manage your team of Superexpert AI agents.
            </p>

            <div className="space-y-4">
                {agents.map((agent) => (
                    <div key={agent.id} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
                        <div>
                            <h2>{agent.name}</h2> 
                            <div className="max-h-32 overflow-hidden line-clamp-3">{agent.description}</div>
                        </div>
                        <div>
                            <Link 
                                href={`/admin/agents/${agent.id}`} 
                                className="btn btnSecondary ml-4">
                                Edit
                            </Link>
                            <Link 
                                href={`/admin/${agent.name}/task-definitions`} 
                                className="btn btnSecondary ml-4">
                                Tasks
                            </Link>
                            <Link 
                                href={`${agent.name}`} 
                                className="btn btnSecondary ml-4">
                                Chat
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <Link 
                    href="/admin/agents"
                    className="btn btnPrimary">
                    New Agent
                </Link>
            </div>
        </div>
    );
}

