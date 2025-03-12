import { Suspense } from 'react';
import CorpusForm from '@/app/ui/corpus-form';
import { getCorpusByIdAction } from '@/lib/actions/admin-actions';
import { Corpus } from '@/lib/corpus';

export default async function EditCorpusPage({
    params,
}: {
    params: Promise<{ [key: string]: string }>;
}) {
    const { id } = await params;
    const corpusId = id && id.length === 1 ? id[0] : undefined;
    const isEditMode = Boolean(corpusId);

    let corpus: Corpus = {
        name: '',
        description: '',
        corpusFiles: [],
    };

    if (isEditMode) {
        corpus = await getCorpusByIdAction(corpusId!);
    }

    return (
        <main>
            <div>
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <CorpusForm corpus={corpus} isEditMode={isEditMode} />
                </Suspense>
            </div>
        </main>
    );
}
