'use client';

import { useState, useRef } from 'react';
import {
    saveCorpusFileAction,
    uploadChunkAction,
} from '@/lib/actions/admin-actions';
import { encodingForModel } from 'js-tiktoken';
import DemoMode from './demo-mode';
import { Corpus } from '@/lib/corpus';
import { deleteCorpusFileAction } from '@/lib/actions/admin-actions';
import BackButton from '@/app/ui/back-button';
import { FormField } from '@/app/ui/form-field';

export default function CorpusFileForm({ corpus }: { corpus: Corpus }) {
    const [currentCorpusFiles, setCurrentCorpusFiles] = useState(
        corpus.corpusFiles
    );
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const chunkSizeRef = useRef<HTMLInputElement>(null);
    const chunkOverlapRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    const handleClick = async () => {
        // Get file
        const inputElement = fileInputRef.current;
        if (
            !inputElement ||
            !inputElement.files ||
            inputElement.files.length == 0
        ) {
            setError('Please select a file to upload');
            return;
        }
        const file = inputElement.files[0];

        // Get chunk size
        const chunkSizeElement = chunkSizeRef.current;
        if (!chunkSizeElement) return;
        const chunkSize = parseInt(chunkSizeElement.value);
        if (isNaN(chunkSize) || chunkSize < 50 || chunkSize > 8192) {
            setError('Chunk size must be between 50 and 8,192 tokens');
            return;
        }

        // Get chunk overlap percentage
        const chunkOverlapElement = chunkOverlapRef.current;
        if (!chunkOverlapElement) return;
        const chunkOverlapPercentage = parseInt(chunkOverlapElement.value);
        if (isNaN(chunkOverlapPercentage)) {
            setError('Chunk overlap must be between 0% and 50%');
            return;
        }

        // Show progress bar immediately with initial status
        setUploading(true);
        setUploadProgress(0.5); // Start with a small value to show the bar immediately

        // Calculate the number of tokens to overlap between chunks
        const overlapTokens = Math.floor(
            (chunkOverlapPercentage / 100) * chunkSize
        );

        // Create new corpus file id
        const result = await saveCorpusFileAction({
            corpusId: corpus.id!,
            chunkSize: chunkSize,
            chunkOverlap: chunkOverlapPercentage,
            fileName: file.name,
        });
        const corpusFileId = result.corpusFileId!;

        // Initialize the tokenizer for the specific model
        const encoding = encodingForModel('text-embedding-3-small');

        try {
            setError('');

            const reader = file.stream().getReader();
            const decoder = new TextDecoder('utf-8');

            let accumulatedText = '';
            let accumulatedTokens = [];
            let chunkIndex = 0;
            let totalSizeUploaded = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // Process any remaining text
                    if (accumulatedTokens.length > 0) {
                        const tokens = encoding.encode(accumulatedText);
                        await sendChunk(
                            corpusFileId,
                            accumulatedText,
                            chunkIndex,
                            file.name,
                            tokens.length
                        );
                        totalSizeUploaded += accumulatedText.length;
                        chunkIndex++;
                    }
                    break;
                }

                // Decode the current chunk of bytes into text
                const textChunk = decoder.decode(value, { stream: true });
                accumulatedText += textChunk;

                // Tokenize the accumulated text
                const tokens = encoding.encode(accumulatedText);
                accumulatedTokens = tokens;

                // While the token count exceeds or equals the chunk size, process chunks
                while (accumulatedTokens.length >= chunkSize) {
                    // Extract the chunk corresponding to chunkSize
                    const chunkTokens = accumulatedTokens.slice(0, chunkSize);
                    const chunkText = encoding.decode(chunkTokens);

                    // Send the chunk
                    await sendChunk(
                        corpusFileId,
                        chunkText,
                        chunkIndex,
                        file.name,
                        chunkTokens.length
                    );
                    totalSizeUploaded += chunkText.length;
                    chunkIndex++;

                    // Update the accumulated text and tokens to remove the processed chunk
                    // Retain the overlap portion for the next chunk
                    accumulatedText = encoding.decode(
                        accumulatedTokens.slice(chunkSize - overlapTokens)
                    );
                    accumulatedTokens = encoding.encode(accumulatedText);

                    // Update upload progress
                    const progress = Math.round(
                        (totalSizeUploaded / file.size) * 100
                    );
                    setUploadProgress(Math.min(progress, 100));
                }
            }

            // All done
            setUploadProgress(100);
            setCurrentCorpusFiles((prevCorpusFiles) => [
                ...prevCorpusFiles,
                {
                    id: corpusFileId,
                    corpusId: corpus.id!,
                    chunkSize,
                    chunkOverlap: chunkOverlapPercentage,
                    fileName: file.name,
                },
            ]);
        } catch (err) {
            console.error('Upload error:', err);
            setError(
                err instanceof Error ? err.message : 'An unknown error occurred'
            );
        } finally {
            setUploading(false);
        }
    };

    const sendChunk = async (
        corpusFileId: string,
        chunk: string,
        index: number,
        fileName: string,
        tokenCount: number
    ) => {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', index.toString());
        formData.append('fileName', fileName);

        const sendFunction = () => uploadChunkAction(corpusFileId, formData);
        await sendWithRetry(sendFunction);

        console.log(
            `Chunk ${index} sent, size: ${chunk.length} characters, tokenCount: ${tokenCount}`
        );
    };

    const sendWithRetry = async (
        sendFunction: () => Promise<void>,
        retries = 3,
        delay = 500
    ) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await sendFunction();
            } catch (error) {
                if (attempt === retries) throw error;
                console.warn(
                    `Attempt ${attempt} failed. Retrying in ${delay}ms...`
                );
                await new Promise((res) => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
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
            <DemoMode />

            <div className="pageContainer">
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
                    {uploadProgress > 0 && (
                        <div className="mt-4">
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                {uploadProgress}% uploaded
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
