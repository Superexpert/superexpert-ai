'use client';

import { useState } from 'react';
import { queryCorpusAction } from '@/lib/actions/admin-actions';
import { Corpus } from '@/lib/corpus';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CorpusQuery, corpusQuerySchema } from '@/lib/corpus-query';
import { ThreeDot } from 'react-loading-indicators';
import { CorpusQueryResult } from '@/lib/corpus-query-result';
import Link from 'next/link';

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
        <div className="formCard">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <Link href="/admin/corpora">&lt; Back</Link>
                </div>

                <h1>Test {corpus.name} Corpus</h1>
                <div>
                    <label>Limit</label>
                    <input {...register('limit')} type="number" />
                    {errors.limit && (
                        <p className="error">{errors.limit.message}</p>
                    )}
                </div>
                <div>
                    <label>Similarity Threshold</label>
                    <input {...register('similarityThreshold')} type="number" />
                    {errors.similarityThreshold && (
                        <p className="error">
                            {errors.similarityThreshold.message}
                        </p>
                    )}
                </div>
                <div>
                    <label>Query</label>
                    <input {...register('query')} type="text" />
                    {errors.query && (
                        <p className="error">{errors.query.message}</p>
                    )}
                </div>
                <button className="btn btnPrimary">Search</button>
                <Link href={`/admin/corpora`}>
                    <button className="btn btnCancel ml-4" type="button">
                        Cancel
                    </button>
                </Link>
            </form>
            {/* Display results here */}
            {matches === null && <p>Enter a query to search</p>}
            {matches && matches.length === 0 && <p>No matches found</p>}
            {busyWaiting && (
                <div>
                    <ThreeDot
                        color="#32cd32"
                        size="medium"
                        text=""
                        textColor=""
                    />
                </div>
            )}
            {matches && matches.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Matches</h2>
                    <div>
                        {matches.map((match) => (
                            <div
                                className="mt-6 break-all bg-slate-100 p-4 rounded-md shadow-sm border border-gray-200 overflow-auto max-h-64"
                                style={{ whiteSpace: 'pre-wrap' }}
                                key={match.id}>
                                {match.chunk}
                                <div className="text-sm text-gray-500 mt-2">
                                    file: {match.fileName}, similarity:{' '}
                                    {(match.similarity * 100).toFixed(0)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}{' '}
        </div>
    );
}
