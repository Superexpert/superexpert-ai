import { Suspense } from 'react';
import CorpusQueryForm from '@/app/(admin)/ui/corpus-query-form';
import { getCorpusByIdAction } from '@/lib/actions/admin-actions';
import { getRAGStrategiesList } from '@superexpert-ai/framework';

export default async function EditCorpusPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    const { id } = await params;
    const corpus = await getCorpusByIdAction(id);
    const ragStrategies = getRAGStrategiesList();


    return (
        <main>
            <div>
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <CorpusQueryForm corpus={corpus} ragStrategies={ragStrategies} />
                </Suspense>
            </div>
        </main>
    );
}
