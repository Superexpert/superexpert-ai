'use client';

import { useState } from 'react';
import { queryCorpusAction } from '@/lib/actions/admin-actions';
import { Corpus } from '@/lib/corpus';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CorpusQuery, corpusQuerySchema } from '@/lib/corpus-query';
import { CorpusQueryResult } from '@/lib/corpus-query-result';
import Link from 'next/link';
import BackButton from '@/app/ui/back-button';
import { FormField } from '@/app/ui/form-field';
import DemoMode from '@/app/ui/demo-mode';

export default function CorpusQueryForm({ corpus }: { corpus: Corpus }) {
    const [matches, setMatches] = useState<CorpusQueryResult[] | null>(null);
    const [busyWaiting, setBusyWaiting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CorpusQuery>({
        resolver: zodResolver(corpusQuerySchema),
        defaultValues: {
            query: '',
            limit: 3,
            similarityThreshold: 50,
        },
    });

    const onSubmit = async (corpusQuery: CorpusQuery) => {
        setMatches(null); // Clear previous matches
        setBusyWaiting(true);
        const results = await queryCorpusAction(corpus.id!, corpusQuery);
        setMatches(results);
        setBusyWaiting(false);
    };

    return (
        <div className="pageContainer">
            <DemoMode />
            <div className="mb-4">
                <BackButton backUrl="/admin/corpora" />
            </div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="pageHeader">Test {corpus.name} Corpus</h1>
                    <p className="text-gray-600">
                        Use this page to perform test queries against your
                        corpus.
                    </p>
                </div>
            </div>
            <form className="pageCard" onSubmit={handleSubmit(onSubmit)}>
                <FormField
                    label="Limit"
                    htmlFor="limit"
                    error={errors.limit?.message}
                    instructions="The maximum number of matches to return.">
                    <input id="limit" type="number" {...register('limit')} />
                </FormField>

                <FormField
                    label="Similarity Threshold"
                    htmlFor="similarityThreshold"
                    error={errors.similarityThreshold?.message}
                    instructions="Only return matches higher than this similarity threshold.">
                    <input
                        id="similarityThreshold"
                        type="number"
                        {...register('similarityThreshold')}
                    />
                </FormField>

                <FormField
                    label="Query"
                    htmlFor="query"
                    error={errors.query?.message}
                    instructions="The query that you want to perform against the corpus.">
                    <input id="query" type="text" {...register('query')} />
                </FormField>

                <div className="flex gap-4 mt-10 pt-4 border-t border-neutral-100">
                    <button className="btnPrimary">Search</button>
                    <Link href={`/admin/corpora`}>
                        <button className="btnSecondary" type="button">
                            Cancel
                        </button>
                    </Link>
                </div>
            </form>
            {/* Display results here */}
            {busyWaiting && (
                <div className="flex justify-center items-center mt-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
                </div>
            )}
            {matches && matches.length === 0 && (
                <div className="pageCard mt-8 space-y-4">No matches found</div>
            )}
            {matches && matches.length > 0 && (
                <div className="pageCard mt-8 space-y-4">
                    <h2 className="text-xl font-semibold">Matches</h2>
                    <div>
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 mb-4">
                                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-sans">
                                    {match.chunk}
                                </pre>
                                <div className="text-sm text-gray-500 border-t border-gray-100 pt-3 flex justify-between items-center">
                                    <span className="truncate">
                                        file: {match.fileName}
                                    </span>
                                    <span className="text-gray-600 font-medium">
                                        similarity:{' '}
                                        {(match.similarity * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}{' '}
        </div>
    );
}
