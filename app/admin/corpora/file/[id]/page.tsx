import { Suspense } from 'react';
import CorpusFileForm from '@/app/ui/corpus-file-form';

export default async function CorpusFilePage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    const { id } = await params;

 
    return (
        <main className="flex items-center justify-center md:h-screen w-full">
            <div className="relative mx-auto flex w-full flex-col space-y-2.5 p-4 md:-mt-32">
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
