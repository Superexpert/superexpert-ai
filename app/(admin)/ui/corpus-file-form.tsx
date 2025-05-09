'use client';

import { useState, useRef } from 'react';
import {
    saveCorpusFileAction,
    uploadChunkAction,
    getLastChunkAction,
    markCorpusFileDoneAction,
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
        /* ─── 1. validate UI input ───────────────────────────────────── */
        const input = fileInputRef.current;
        if (!input?.files?.length) {
            setError('Please select a file');
            return;
        }
        const file = input.files[0];

        const chunkSize = Number(chunkSizeRef.current!.value);
        const overlapPct = Number(chunkOverlapRef.current!.value);

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

        /* ─── 2. make / reuse corpusFile row ─────────────────────────── */
        setUploading(true); // mounts the bar
        setUploadProgress(0.5); // tiny stub width
        setUploadDone(false);

        const { corpusFileId } = await saveCorpusFileAction({
            corpusId: corpus.id!,
            chunkSize,
            chunkOverlap: overlapPct,
            fileName: file.name,
            done: false,
        });

        /* ─── 3. checkpoint ──────────────────────────────────────────── */
        const lastChunkSaved = await getLastChunkAction(corpusFileId!);
        const nextChunk = lastChunkSaved + 1;

        if (lastChunkSaved >= 0) {
            console.log(`Resuming ${file.name} from chunk ${nextChunk}`);
        }

        const overlapTokens = Math.floor((overlapPct / 100) * chunkSize);
        const enc = encodingForModel('text-embedding-3-small');

        /* 1 token ≈ 4 bytes for English; give the bar a decent estimate up front */
        const estBytes = nextChunk * (chunkSize - overlapTokens) * 4;
        setUploadProgress(Math.min(99, (estBytes / file.size) * 100));

        /* ─── 4. stream + upload ─────────────────────────────────────── */
        let idx = nextChunk;
        let uploaded = estBytes;

        try {
            const reader = file.stream().getReader();
            const decoder = new TextDecoder('utf-8');
            let accText = '';
            let accTokens: number[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                accText += decoder.decode(value, { stream: true });
                accTokens = enc.encode(accText);

                while (accTokens.length >= chunkSize) {
                    const chunkTokens = accTokens.slice(0, chunkSize);
                    const chunkText = enc.decode(chunkTokens);

                    /* skip or send depending on checkpoint */
                    if (idx <= lastChunkSaved) {
                        uploaded += chunkText.length; // byte-accurate bar
                    } else {
                        await sendChunk(
                            corpusFileId!,
                            chunkText,
                            idx,
                            file.name,
                            chunkTokens.length
                        );
                        uploaded += chunkText.length;
                    }

                    idx++;

                    /* keep the overlap for sliding window */
                    accText = enc.decode(
                        accTokens.slice(chunkSize - overlapTokens)
                    );
                    accTokens = enc.encode(accText);

                    setUploadProgress(
                        Math.min(99, Math.floor((uploaded / file.size) * 100))
                    );
                }
            }

            /* tail */
            if (accTokens.length && idx > lastChunkSaved) {
                await sendChunk(
                    corpusFileId!,
                    accText,
                    idx,
                    file.name,
                    accTokens.length
                );
                uploaded += accText.length;
            }

            /* Mark as done */
            await markCorpusFileDoneAction(corpus.id!, corpusFileId!);
            setCurrentCorpusFiles(prev =>
                prev.map(cf =>
                  cf.id === corpusFileId ? { ...cf, done: true } : cf
                )
              );

            setUploadProgress(100);
            setUploadDone(true);

            /* first-time insert → refresh list */
            if (lastChunkSaved === -1) {
                setCurrentCorpusFiles((prev) => [
                    ...prev,
                    {
                        id: corpusFileId,
                        corpusId: corpus.id!,
                        chunkSize,
                        chunkOverlap: overlapPct,
                        fileName: file.name,
                        done: true,
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
            await deleteCorpusFileAction(corpus.id!, corpusFileId);
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
                            Use this page to upload and manage your corpus files.
                            If you need to upload a large file, or a PDF file, then
                            we recommend using the @superexpert-ai/rag tool.
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
                                    {!corpusFile.done && (
                                        <span className="text-orange-500"> partial upload</span>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    handleDeleteCorpusFile(corpusFile.id!)
                                }
                                disabled={uploading}
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
                                defaultValue={1000}
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
                                className={
                                  `btnPrimary inline-flex cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`
                            }>
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
