'use client';

import { useState, useRef } from 'react';
import {
    saveCorpusFileAction,
    uploadChunkAction,
} from '@/lib/actions/admin-actions';
import { encodingForModel } from 'js-tiktoken';
import Link from 'next/link';
import DemoMode from './demo-mode';

export default function CorpusFileForm({ corpusId }: { corpusId: string }) {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const chunkSizeRef = useRef<HTMLInputElement>(null);
    const chunkOverlapRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = async () => {
        // Get file
        const inputElement = fileInputRef.current;
        if (!inputElement) return;
        if (!inputElement.files) return;
        const file = inputElement.files[0];

        // Get chunk size
        const chunkSizeElement = chunkSizeRef.current;
        if (!chunkSizeElement) return;
        const chunkSize = parseInt(chunkSizeElement.value);
        if (isNaN(chunkSize)) return;

        // Get chunk overlap
        const chunkOverlapElement = chunkOverlapRef.current;
        if (!chunkOverlapElement) return;
        const chunkOverlap = parseInt(chunkOverlapElement.value);
        if (isNaN(chunkOverlap)) return;

        // Create new corpus file id
        const result = await saveCorpusFileAction({
            corpusId: corpusId,
            chunkSize: chunkSize,
            chunkOverlap: chunkOverlap,
            fileName: file.name,
        });
        const corpusFileId = result.corpusFileId!;

        // Start uploading
        setUploading(true);

        // Initialize the tokenizer for the specific model
        const encoding = encodingForModel('text-embedding-3-small');

        try {
            setError('');
            setUploadProgress(0);

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

                // While the token count exceeds MAX_TOKENS, process chunks
                while (accumulatedTokens.length >= chunkSize) {
                    // Extract the chunk corresponding to MAX_TOKENS
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
                    accumulatedText = accumulatedText.slice(chunkText.length);
                    accumulatedTokens = accumulatedTokens.slice(chunkSize);

                    // Update upload progress
                    const progress = Math.round(
                        (totalSizeUploaded / file.size) * 100
                    );
                    setUploadProgress(Math.min(progress, 100));
                }
            }

            setUploadProgress(100);
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

        await uploadChunkAction(corpusFileId, formData);
        console.log(
            `Chunk ${index} sent, size: ${chunk.length} characters, tokenCount: ${tokenCount}`
        );
        //console.log(chunk);
    };

    return (
        <>
            <DemoMode />

            <div className="formCard">
                <h1>New Corpus File</h1>

                <div>{error && <p className="error">{error}</p>}</div>

                <div>
                    <label>Chunk Size</label>
                    <div className="instructions">
                        Enter the size of the chunks in tokens. The maximum is
                        8,192.
                    </div>
                    <input
                        type="number"
                        ref={chunkSizeRef}
                        min={50}
                        max={8192}
                        defaultValue={100}
                        disabled={uploading}
                    />
                </div>
                <div>
                    <label>Chunk Overlap</label>
                    <div className="instructions">
                        The percentage of token overlap between chunks.
                    </div>
                    <input
                        type="number"
                        ref={chunkOverlapRef}
                        min={0}
                        max={100}
                        defaultValue={15}
                        disabled={uploading}
                    />
                </div>

                <div className="p-4 border rounded-md">
                    <input type="file" ref={fileInputRef} />

                    {uploadProgress > 0 && (
                        <div className="mt-2">
                            <progress
                                value={uploadProgress}
                                max="100"
                                className="w-full"
                            />
                            <p>{uploadProgress}% uploaded</p>
                        </div>
                    )}
                </div>

                        disabled={uploading}
                <button className="btn btnPrimary" onClick={handleClick} disabled={uploading}>
                    Save
                </button>
                <Link href={`/admin/corpora/corpus/${corpusId}`}>
                    <button className="btn btnCancel ml-4" type="button" disabled={uploading}>
                        Cancel
                    </button>
                </Link>
            </div>
        </>

    );
}
