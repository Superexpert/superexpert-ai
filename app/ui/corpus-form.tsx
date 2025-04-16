'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
    saveCorpusAction,
    deleteCorpusAction,
} from '@/lib/actions/admin-actions';
import { Corpus, corpusSchema } from '@/lib/corpus';
import DemoMode from '@/app/ui/demo-mode';
import BackButton from '@/app/ui/back-button';
import { FormField } from '@/app/ui/form-field';

export default function CorpusForm({
    corpus,
    isEditMode,
}: {
    corpus: Corpus;
    isEditMode: boolean;
}) {
    const [serverError, setServerError] = useState('');
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

    return (
        <>
            <div className="pageContainer">
                <DemoMode />

                <div className="mb-4">
                    <BackButton backUrl="/admin/corpora" />
                </div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="pageHeader">
                            {isEditMode ? 'Edit Corpus' : 'New Corpus'}
                        </h1>
                        <p className="text-gray-600">
                            A corpus contains a set of files that can be
                            semantically searched.
                        </p>
                    </div>
                </div>

                <form className="pageCard" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        {serverError && <p className="error">{serverError}</p>}
                    </div>

                    <FormField
                        label="Corpus Name"
                        htmlFor="name"
                        error={errors.name?.message}
                        instructions="The corpus name can be anything that you want.">
                        <input id="name" type="text" {...register('name')} />
                    </FormField>

                    <FormField
                        label="Corpus Description"
                        htmlFor="description"
                        error={errors.description?.message}
                        instructions="Describe the contents of the corpus.">
                        <textarea
                            id="description"
                            {...register('description')}
                        />
                    </FormField>

                    <div className="flex gap-4 mt-10 pt-4 border-t border-neutral-100">
                        <button className="btnPrimary" type="submit">
                            Save
                        </button>
                        {isEditMode && (
                            <button
                                className="btnDanger"
                                type="button"
                                onClick={handleDeleteCorpus}>
                                Delete
                            </button>
                        )}
                        <Link href="/admin/corpora">
                            <button className="btnSecondary" type="button">
                                Cancel
                            </button>
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
