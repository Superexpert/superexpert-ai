import Link from 'next/link';
import BackButton from '@/app/ui/back-button';
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

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-4">
          <BackButton backUrl='/' />
        </div>

        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="pageHeader">{agentName} Tasks</h1>
            <p className="text-gray-600 max-w-3xl mt-2">
              A task provides the instructions, AI model, and custom tools used by an agent. The global task provides default values for these settings. The home task is always the first task that an AI agent performs.
            </p>
          </div>
          <Link
            href={`/admin/${agentName}/task-definitions/edit/`}
            className="btnPrimary"
          >
            New Task
          </Link>
        </div>

        {/* Task Definitions Container */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {taskDefinitions.map((td) => (
            <div
              key={td.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{td.name}</h2>
                <p className="mt-1 text-gray-600">{td.description}</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Link
                  href={`/admin/${agentName}/task-definitions/edit/${td.id}`}
                  className="btnSecondary"
                >
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



// import Link from 'next/link';
// import DemoMode from '@/app/ui/demo-mode';

// export default function TaskDefinitionList({
//     agentName,
//     taskDefinitions,
// }: {
//     agentName: string;
//     taskDefinitions: { id: string; name: string; description: string }[];
// }) {
//     return (
//         <>
//             <DemoMode />
//             <div className="formCard">
//                 <div>
//                     <Link href="/">&lt; Back</Link>
//                 </div>

//                 <h1>{agentName} Task Definitions</h1>
//                 <div className="instructions">
//                     A task definition provides the instructions, AI model, and
//                     custom tools used by an agent. The global task provides
//                     default values for these settings. The home task is always
//                     the first task that an AI agent performs.
//                 </div>
//                 <div className="space-y-4">
//                     {taskDefinitions.map((td) => (
//                         <div
//                             key={td.id}
//                             className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
//                             <div>
//                                 <span className="text-lg">{td.name}</span>
//                                 <br />
//                                 <span>{td.description}</span>
//                             </div>
//                             <Link
//                                 href={`/admin/${agentName}/task-definitions/edit/${td.id}`}
//                                 className="btn btnSecondary">
//                                 Edit
//                             </Link>
//                         </div>
//                     ))}
//                 </div>

//                 <div className="mt-6">
//                     <Link
//                         href={`/admin/${agentName}/task-definitions/edit/`}
//                         className="btn btnPrimary">
//                         New Task Definition
//                     </Link>
//                     <Link href={`/`} className="btn btnCancel ml-4">
//                         Cancel
//                     </Link>
//                 </div>
//             </div>
//         </>
//     );
// }
