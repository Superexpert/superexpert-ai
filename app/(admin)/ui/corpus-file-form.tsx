'use client';

import { useState, useRef } from 'react';
import {
    saveCorpusFileAction,
    uploadChunkAction,
    getLastChunkAction,
} from '@/lib/actions/admin-actions';
import { encodingForModel } from 'js-tiktoken';
import DemoMode from './demo-mode';
import { Corpus } from '@/lib/corpus';
import { deleteCorpusFileAction } from '@/lib/actions/admin-actions';
import BackButton from '@/app/(admin)/ui/back-button';
import { FormField } from '@/app/(admin)/ui/form-field';

export default function CorpusFileForm({ corpus }: { corpus: Corpus }) {
    const [currentCorpusFiles, setCurrentCorpusFiles] = useState(
        corpus.corpusFiles
    );
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadDone, setUploadDone] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const chunkSizeRef = useRef<HTMLInputElement>(null);
    const chunkOverlapRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    /* ───────────────────────── handleClick ───────────────────────── */
    const handleClick = async () => {
        /* ── validate UI inputs (unchanged) ──────────────────────────── */
        const inputEl = fileInputRef.current;
        if (!inputEl || !inputEl.files?.length) {
            setError('Please select a file to upload');
            return;
        }
        const file = inputEl.files[0];

        const sizeEl = chunkSizeRef.current!;
        const overlapEl = chunkOverlapRef.current!;
        const chunkSize = parseInt(sizeEl.value);
        const overlapPct = parseInt(overlapEl.value);

        if (
            isNaN(chunkSize) ||
            chunkSize < 50 ||
            chunkSize > 8192 ||
            isNaN(overlapPct) ||
            overlapPct < 0 ||
            overlapPct > 50
        ) {
            setError('Invalid chunk size / overlap');
            return;
        }

        /* ── create or reuse corpusFile row ─────────────────────────── */
        setUploading(true);
        setUploadProgress(0.5);
        setUploadDone(false);

        const { corpusFileId } = await saveCorpusFileAction({
            corpusId: corpus.id!,
            chunkSize,
            chunkOverlap: overlapPct,
            fileName: file.name,
        });

        /* ── look up resume point (NEW) ─────────────────────────────── */
        const lastChunkSaved = await getLastChunkAction(corpusFileId!); // -1 if none

        if (lastChunkSaved !== -1) {
            console.log(
                `Resuming ${file.name} from chunk ${lastChunkSaved + 1}`
            );
        }

        const overlapTokens = Math.floor((overlapPct / 100) * chunkSize);
        const enc = encodingForModel('text-embedding-3-small');

        let chunkIdx = lastChunkSaved + 1; // ← declare only once
        let uploaded =
            (lastChunkSaved + 1) * // baseline for progress bar
            (chunkSize - overlapTokens);
        setUploadProgress((uploaded / file.size) * 100);

        try {
            setError('');
            const reader = file.stream().getReader();
            const decoder = new TextDecoder('utf-8');

            let accText = '';
            let accTokens: number[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                accText += decoder.decode(value, { stream: true });
                accTokens = enc.encode(accText);

                /* skip chunks we already stored */
                while (accTokens.length >= chunkSize) {
                    if (chunkIdx < lastChunkSaved + 1) {
                        /* discard without sending */
                        accText = enc.decode(
                            accTokens.slice(chunkSize - overlapTokens)
                        );
                        accTokens = enc.encode(accText);
                        chunkIdx++;
                        uploaded += chunkSize; // for correct % bar
                        continue;
                    }

                    /* ── send new chunk ───────────────────────────────────── */
                    const chunkTokens = accTokens.slice(0, chunkSize);
                    const chunkText = enc.decode(chunkTokens);

                    await sendChunk(
                        corpusFileId!,
                        chunkText,
                        chunkIdx,
                        file.name,
                        chunkTokens.length
                    );

                    uploaded += chunkText.length;
                    chunkIdx++;

                    /* retain overlap */
                    accText = enc.decode(
                        accTokens.slice(chunkSize - overlapTokens)
                    );
                    accTokens = enc.encode(accText);

                    /* ── update progress bar ─────────────────────────────── */
                    const pct = Math.min(
                        99,
                        Math.floor((uploaded / file.size) * 100)
                    );
                    setUploadProgress(pct);
                }
            }

            /* ── flush tail ───────────────────────────────────────────── */
            if (accTokens.length && chunkIdx >= lastChunkSaved + 1) {
                await sendChunk(
                    corpusFileId!,
                    accText,
                    chunkIdx,
                    file.name,
                    accTokens.length
                );
            }

            setUploadProgress(100);
            setUploadDone(true);
            if (lastChunkSaved === -1) {
                setCurrentCorpusFiles((prev) => [
                    ...prev,
                    {
                        id: corpusFileId,
                        corpusId: corpus.id!,
                        chunkSize,
                        chunkOverlap: overlapPct,
                        fileName: file.name,
                    },
                ]);
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };
    /* ─────────────────── sendChunk & helpers (unchanged) ─────────── */
    const sendChunk = async (
        corpusFileId: string,
        chunk: string,
        index: number,
        fileName: string,
        tokenCount: number
    ) => {
        const fd = new FormData();
        fd.append('chunk', chunk);
        fd.append('chunkIndex', index.toString());
        fd.append('fileName', fileName);

        await sendWithRetry(() => uploadChunkAction(corpusFileId, fd));
        console.log(`↑ chunk ${index} (${tokenCount} tokens)`);
    };

    const sendWithRetry = async (
        fn: () => Promise<void>,
        tries = 3,
        delay = 500
    ) => {
        for (let t = 1; t <= tries; t++) {
            try {
                return await fn();
            } catch (e) {
                if (t === tries) throw e;
                await new Promise((r) => setTimeout(r, delay));
                delay *= 2;
            }
        }
    };

    const handleDeleteCorpusFile = async (corpusFileId: string) => {
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
            prevCorpusFiles.filter((cp) => cp.id !== corpusFileId)
        );
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
                        <h1 className="pageHeader">{corpus.name} Files</h1>
                        <p className="text-gray-600">
                            A corpus contains a set of files that can be
                            semantically searched.
                        </p>
                    </div>
                </div>

                <div className="pageCard">
                    {currentCorpusFiles.map((corpusFile) => (
                        <div
                            key={corpusFile.id}
                            className="flex justify-between items-center p-4 border border-gray-200 rounded-2xl bg-white shadow-sm mb-3">
                            <div>
                                <div className="text-sm font-semibold text-gray-900">
                                    {corpusFile.fileName}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Chunk Size:{' '}
                                    {corpusFile.chunkSize.toLocaleString()}{' '}
                                    tokens, Overlap: {corpusFile.chunkOverlap}%
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    handleDeleteCorpusFile(corpusFile.id!)
                                }
                                className="btnDanger">
                                Delete
                            </button>
                        </div>
                    ))}

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                        Add File
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Upload a new file to this corpus. You can control how
                        the file will be chunked for semantic search.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                            label="Chunk Size"
                            htmlFor="chunkSize"
                            instructions="Enter the size of the chunks in tokens. The maximum is 8,192.">
                            <input
                                id="chunkSize"
                                type="number"
                                ref={chunkSizeRef}
                                min={50}
                                max={8192}
                                defaultValue={100}
                                disabled={uploading}
                            />
                        </FormField>

                        <FormField
                            label="Chunk Overlap (%)"
                            htmlFor="chunkOverlap"
                            instructions="The percentage of token overlap between chunks.">
                            <input
                                id="chunkOverlap"
                                type="number"
                                ref={chunkOverlapRef}
                                min={0}
                                max={50}
                                defaultValue={15}
                                disabled={uploading}
                            />
                        </FormField>
                    </div>

                    {isDemoMode ? (
                        <div className="p-4 bg-gray-100 border border-gray-200 rounded-md">
                            <p className="text-sm text-gray-700">
                                Demo mode enabled: File uploads are disabled.
                            </p>
                        </div>
                    ) : (
                        <>
                            <label
                                htmlFor="file-upload"
                                className="btnPrimary inline-flex cursor-pointer">
                                Choose File
                            </label>
                            <input
                                id="file-upload"
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,application/json,text/csv"
                                onChange={handleClick}
                                className="hidden"
                            />
                        </>
                    )}
                    {uploading && (
                        <div className="mt-4">
                            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 transition-[width] duration-300"
                                    style={{
                                        width: `${Math.max(
                                            uploadProgress,
                                            0.1
                                        )}%`,
                                    }}
                                />
                                {uploadDone && (
                                    <div className="absolute inset-0 animate-pulse bg-orange-300/30 pointer-events-none" />
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                {Math.floor(uploadProgress)}% uploaded
                                {uploadDone && ', finalizing…'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
