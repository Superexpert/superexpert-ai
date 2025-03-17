import { Suspense } from 'react';
import CorpusQueryForm from '@/app/ui/corpus-query-form';
import { getCorpusByIdAction } from '@/lib/actions/admin-actions';

export default async function EditCorpusPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    const { id } = await params;
    const corpus = await getCorpusByIdAction(id);



    return (
        <main>
            <div>
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <CorpusQueryForm corpus={corpus} />
                </Suspense>
            </div>
        </main>
    );
}
