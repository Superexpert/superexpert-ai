import { Suspense } from 'react';
import CorpusFileForm from '@/app/ui/corpus-file-form';

export default async function CorpusFilePage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    const { id } = await params;

 
    return (
        <main>
            <div>
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <CorpusFileForm corpusId={id} />
                </Suspense>
            </div>
        </main>
    );
}
