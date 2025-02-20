import Link from "next/link";


export default function AgentList(
    { agents }: { agents: { id: string; name: string; description: string; }[] }
) {
    return (
        <div className="w-full max-w-[800px] mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="mb-4">Agents</h1>
            <p className="text-gray-600 mb-6">
                Manage your team of Superexpert AI agents.
            </p>

            <div className="space-y-4">
                {agents.map((agent) => (
                    <div key={agent.id} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
                        <div>
                            <Link href={`/${agent.name}`} className="text-blue-600">
                                <span className="text-lg">{agent.name}</span> 
                            </Link>
                            <div className="max-h-32 overflow-hidden line-clamp-3">{agent.description}</div>
                        </div>
                        <Link 
                            href={`/agents/${agent.id}`} 
                            className="btn btnPrimary"
                        >
                            Edit
                        </Link>
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <Link 
                    href="/agents"
                    className="btn btnPrimary"
                >
                    New Agent
                </Link>
            </div>
        </div>
    );
}

