import { Suspense } from 'react';
import LogsClient from '@/app/(admin)/ui/logs-client';


export default async function LogsPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    // Check for valid agent name
    // No point in authorizing here, we perform authorization in the route
    const resolvedParams = await params;
    const {agentName } = resolvedParams;
    return (
        <main>
            <div>
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <LogsClient agentName={agentName} />
                </Suspense>
            </div>
        </main>
    );
}
