import { Suspense } from 'react';
import CorpusFileForm from '@/app/(admin)/ui/corpus-file-form';
import { getCorpusByIdAction } from '@/lib/actions/admin-actions';


export default async function CorpusFilePage({
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
                    <CorpusFileForm corpus={corpus} />
                </Suspense>
            </div>
        </main>
    );
}
