'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
    saveCorpusAction,
    deleteCorpusAction,
    deleteCorpusFileAction,
} from '@/lib/actions/admin-actions';
import { Corpus, corpusSchema } from '@/lib/corpus';
import DemoMode from '@/app/ui/demo-mode';
import CorpusQuery from '@/app/ui/corpus-query';

export default function CorpusForm({
    corpus,
    isEditMode,
}: {
    corpus: Corpus;
    isEditMode: boolean;
}) {
    const [serverError, setServerError] = useState('');
    const [currentCorpusFiles, setCurrentCorpusFiles] = useState(corpus.corpusFiles);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Corpus>({
        resolver: zodResolver(corpusSchema),
        defaultValues: corpus,
    });

    const onSubmit = async (newCorpus: Corpus) => {
        const result = await saveCorpusAction(newCorpus);
        if (result.success) {
            router.push('/admin/corpora');
        } else {
            setServerError(result.serverError);
        }
    };

    const handleDeleteCorpus = async () => {
        if (!corpus.id) return;
        const confirmed = window.confirm(
            'Are you sure you want to delete this corpus?'
        );
        if (!confirmed) return;

        try {
            await deleteCorpusAction(corpus.id);
        } catch (error) {
            console.error('Failed to delete corpus', error);
        }
    };

    const handleDeleteCorpusFile = async (corpusFileId:string) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this corpus file?'
        );
        if (!confirmed) return; // Do nothing if the user cancels   

        try {
            await deleteCorpusFileAction(corpusFileId);
        } catch (error) {
            console.error('Failed to delete corpus file', error);
        }

        setCurrentCorpusFiles((prevCorpusFiles) =>
            prevCorpusFiles.filter(
                (cp) => cp.id !== corpusFileId
            )
        );

    }

    return (
        <>
            <DemoMode />

            <div className="formCard">
                <h1>{isEditMode ? 'Edit Corpus' : 'New Corpus'}</h1>
                <div className="instructions">
                    A corpus contains a set of files that can be semantically
                    searched.
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        {serverError && <p className="error">{serverError}</p>}
                    </div>

                    <div>
                        <label>Corpus Name</label>
                        <div className="instructions">
                            The corpus name can be anything that you want.
                        </div>
                        <input type="text" {...register('name')} />
                        {errors.name && (
                            <p className="error">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label>Corpus Description</label>
                        <div className="instructions">
                            Describe the contents of the corpus.
                        </div>
                        <textarea {...register('description')}></textarea>
                        {errors.description && (
                            <p className="error">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <button className="btn btnPrimary" type="submit">
                        Save
                    </button>
                    {isEditMode && (
                        <button
                            className="btn btnDanger ml-4"
                            type="button"
                            onClick={handleDeleteCorpus}>
                            Delete
                        </button>
                    )}
                    <Link href="/admin/corpora">
                        <button className="btn btnCancel ml-4" type="button">
                            Cancel
                        </button>
                    </Link>
                </form>

                {isEditMode && (
                    <>
                        <div>
                            <h1>Files</h1>

                            {currentCorpusFiles.map((corpusFile) => (
                                <div
                                    key={corpusFile.id}
                                    className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
                                    <div>
                                        <h2>{corpusFile.fileName}</h2>
                                        <p>
                                            Chunk Size:{' '}
                                            {corpusFile.chunkSize.toLocaleString()}{' '}
                                            tokens, Chunk Overlap{' '}
                                            {corpusFile.chunkOverlap}%
                                        </p>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCorpusFile(corpusFile.id!)}
                                            className="btn btnSecondary ml-4">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <Link href={`/admin/corpora/file/${corpus.id}`}>
                                Add File
                            </Link>
                        </div>

                            <CorpusQuery corpusId={corpus.id!} />
                    </>
                )}
            </div>
        </>
    );
}
