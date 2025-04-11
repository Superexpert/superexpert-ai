import Link from 'next/link';
import DemoMode from '@/app/ui/demo-mode';

export default function AgentList({
  agents,
}: {
  agents: { id: string; name: string; description: string }[];
}) {
  return (
    <>
      <DemoMode />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
            <p className="text-gray-600">Manage your team of Superexpert.AI agents.</p>
          </div>
          <Link
            href="/admin/agents"
            className="inline-flex items-center rounded-full bg-orange-500 hover:bg-orange-600 px-5 py-2 font-normal text-white shadow transition duration-200"
          >
            New agent
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{agent.name}</h2>
                <p className="mt-1 text-gray-600">{agent.description}</p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-2">
                <Link
                  href={`/admin/agents/${agent.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-600 font-medium rounded-full shadow-sm hover:bg-gray-100 transition"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/${agent.name}/task-definitions`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-600 font-medium rounded-full shadow-sm hover:bg-gray-100 transition"
                >
                  Tasks
                </Link>
                <Link
                  href={`${agent.name}`}
                  target="_blank"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-600 font-medium rounded-full shadow-sm hover:bg-gray-100 transition"
                >
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


// import Link from 'next/link';
// import DemoMode from '@/app/ui/demo-mode';

// export default function AgentList({
//     agents,
// }: {
//     agents: { id: string; name: string; description: string }[];
// }) {
//     return (
//         <>
//             <DemoMode />

//             <div className="formCard">
//                 <h1 className="mb-4">Agents</h1>
//                 <p className="text-gray-600 mb-6">
//                     Manage your team of Superexpert AI agents.
//                 </p>

//                 <div className="space-y-4">
//                     {agents.map((agent) => (
//                         <div
//                             key={agent.id}
//                             className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
//                             <div>
//                                 <h2>{agent.name}</h2>
//                                 <div className="max-h-32 overflow-hidden line-clamp-3">
//                                     {agent.description}
//                                 </div>
//                             </div>
//                             <div>
//                                 <Link
//                                     href={`/admin/agents/${agent.id}`}
//                                     className="btn btnSecondary ml-4">
//                                     Edit
//                                 </Link>
//                                 <Link
//                                     href={`/admin/${agent.name}/task-definitions`}
//                                     className="btn btnSecondary ml-4">
//                                     Tasks
//                                 </Link>
//                                 <Link
//                                     href={`${agent.name}`}
//                                     target="_blank"
//                                     className="btn btnSecondary ml-4">
//                                     Chat
//                                 </Link>
//                             </div>
//                         </div>
//                     ))}
//                 </div>

//                 <div className="mt-6">
//                     <Link href="/admin/agents" className="btn btnPrimary">
//                         New Agent
//                     </Link>
//                 </div>
//             </div>
//         </>
//     );
// }
