import { Suspense } from 'react';
import CorpusFileForm from '@/app/ui/corpus-file-form';
import { getCorpusByIdAction } from '@/lib/actions/admin-actions';
import { Corpus } from '@/lib/corpus';

export default async function CorpusFilePage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    const { id } = await params;
    const corpusId = id && id.length === 1 ? id[0] : undefined;

 
    return (
        <main className="flex items-center justify-center md:h-screen w-full">
            <div className="relative mx-auto flex w-full flex-col space-y-2.5 p-4 md:-mt-32">
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <CorpusFileForm />
                </Suspense>
            </div>
        </main>
    );
}
