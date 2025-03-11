'use client';
import { useState, useEffect } from 'react';
import DemoMode from '@/app/ui/demo-mode';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CorpusFile, corpusFileSchema } from '@/lib/corpus-file';
import {
    saveCorpusFileAction,
    uploadChunkAction,
} from '@/lib/actions/admin-actions';
import { encodingForModel } from 'js-tiktoken';
import Link from 'next/link';
import { z } from 'zod';

interface CorpusFileFormData extends CorpusFile {
    fileInput?: FileList;
}

export const corpusFileFormSchema = corpusFileSchema.extend({
    fileInput: z
      .any()
      .refine(
        (files) => files instanceof FileList && files.length > 0, 
        'File is required'
      ),
  });

export default function CorpusFileForm({
    corpusId,
}: {
    corpusId: string;
}) {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [serverError, setServerError] = useState('');
    const [uploadError, setUploadError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CorpusFileFormData>({
        resolver: zodResolver(corpusFileFormSchema),
        defaultValues: {
            corpusId: corpusId,
            chunkSize: 1024,
            chunkOverlap: 15,
        },
    });

    // Watch for file changes and update the fileName field
    const fileInput = watch('fileInput');

    useEffect(() => {
        if (fileInput && fileInput.length > 0) {
            setValue('fileName', fileInput[0].name);
        }
    }, [fileInput, setValue]);

    const onSubmit = async (data: CorpusFileFormData) => {
        if (!data.fileInput || data.fileInput.length === 0) {
            setUploadError('No file selected');
            return;
        }

        console.log('saving');
        console.dir(data, { depth: null });
        const result = await saveCorpusFileAction(data);
        if (result.success) {
            const file = data.fileInput[0];
            await handleUpload(result.corpusFileId!, file, data.chunkSize);
            //router.push('/admin/corpora');
        } else {
            console.log("server error", result.serverError);
            setServerError(result.serverError);
        }
    };

    // const handleUpload = async (
    //     corpusFileId: string,
    //     file: File,
    //     chunkSize: number
    // ) => {
    //     if (!file) return;
    
    //     try {
    //         setUploadError('');
    //         setUploadProgress(0);
    
    //         // Read the entire file
    //         const buffer = await file.arrayBuffer();
    //         const text = new TextDecoder().decode(buffer);
            
    //         // Extremely conservative max size - only ~10% of the 1MB limit
    //         const MAX_CHUNK_SIZE = 100 * 1024; // 100KB
            
    //         let position = 0;
    //         let chunkIndex = 0;
    //         let totalSizeUploaded = 0;
    
    //         while (position < text.length) {
    //             // Take a very small chunk
    //             const end = Math.min(position + MAX_CHUNK_SIZE, text.length);
    //             const chunkText = text.slice(position, end);
    //             position = end;
                
    //             // Send the chunk with recursive splitting on failure
    //             await sendChunkWithRetry(
    //                 corpusFileId,
    //                 chunkText,
    //                 chunkIndex,
    //                 file.name,
    //                 0
    //             );
                
    //             totalSizeUploaded += chunkText.length;
    //             chunkIndex++;
                
    //             // Update progress
    //             const progress = Math.round((totalSizeUploaded / text.length) * 100);
    //             setUploadProgress(Math.min(progress, 100));
    //         }
    
    //         setUploadProgress(100);
    //     } catch (err) {
    //         console.error('Upload error:', err);
    //         setUploadError(
    //             err instanceof Error ? err.message : 'An unknown error occurred'
    //         );
    //     }
    // };
    
    // // Recursive function that splits chunks until they're small enough
    // const sendChunkWithRetry = async (
    //     corpusFileId: string,
    //     chunk: string,
    //     index: number,
    //     fileName: string,
    //     tokenCount: number,
    //     depth = 0
    // ) => {
    //     // Safety mechanism - don't go too deep with recursion
    //     if (depth > 5) {
    //         throw new Error("Failed to send chunk: Maximum recursion depth reached");
    //     }
        
    //     try {
    //         await sendChunk(corpusFileId, chunk, index, fileName, tokenCount);
    //         return index + 1; // Return next index to use
    //     } catch (error) {
    //         console.log(`Chunk failed at depth ${depth}, size: ${chunk.length}. Splitting...`);
            
    //         // If chunk is still reasonably large, try splitting
    //         if (chunk.length > 1000) {
    //             const halfSize = Math.floor(chunk.length / 2);
    //             const firstHalf = chunk.slice(0, halfSize);
    //             const secondHalf = chunk.slice(halfSize);
                
    //             // Send first half and get next index
    //             const nextIndex = await sendChunkWithRetry(
    //                 corpusFileId, 
    //                 firstHalf,
    //                 index,
    //                 fileName,
    //                 0,
    //                 depth + 1
    //             );
                
    //             // Send second half with updated index
    //             return await sendChunkWithRetry(
    //                 corpusFileId,
    //                 secondHalf,
    //                 nextIndex,
    //                 fileName,
    //                 0,
    //                 depth + 1
    //             );
    //         } else {
    //             // If chunk is already very small, something else is wrong
    //             throw new Error(`Failed to send small chunk (${chunk.length} chars): ${error.message}`);
    //         }
    //     }
    // };


    const handleUpload = async (
        corpusFileId: string,
        file: File,
        chunkSize: number
    ) => {
        if (!file) return;

        // Initialize the tokenizer for the specific model
        const encoding = encodingForModel('text-embedding-3-small');

        try {
            setUploadError('');
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
            setUploadError(
                err instanceof Error ? err.message : 'An unknown error occurred'
            );
        } finally {
            //encoding.free();
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

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        {serverError && <p className="error">{serverError}</p>}
                    </div>

                    <div>
                        <label>Chunk Size</label>
                        <div className="instructions">
                            Enter the size of the chunks in tokens. The maximum
                            is 8,192.
                        </div>
                        <input
                            {...register('chunkSize', {
                                setValueAs: (value) =>
                                    !value ? null : Number(value),
                            })}
                            type="number"
                        />
                        {errors.chunkSize && (
                            <p className="error">{errors.chunkSize.message}</p>
                        )}
                    </div>
                    <div>
                        <label>Chunk Overlap</label>
                        <div className="instructions">
                            The percentage of token overlap between chunks.
                        </div>
                        <input
                            {...register('chunkOverlap', {
                                setValueAs: (value) =>
                                    !value ? null : Number(value),
                            })}
                            type="number"
                        />
                        {errors.chunkOverlap && (
                            <p className="error">
                                {errors.chunkOverlap.message}
                            </p>
                        )}
                    </div>

                    <div className="p-4 border rounded-md">
                        <input type="file" {...register('fileInput')} />

                        {errors.fileInput && (
                            <p className="error">{errors.fileInput.message}</p>
                        )}

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

                        {uploadError && (
                            <div className="mt-2 text-red-500">
                                Error: {uploadError}
                            </div>
                        )}
                    </div>

                    <button className="btn btnPrimary" type="submit">
                        Save
                    </button>
                    <Link href={`/admin/corpora/corpus/${corpusId}`}>
                        <button className="btn btnCancel ml-4" type="button">
                            Cancel
                        </button>
                    </Link>
                </form>
            </div>
        </>
    );
}
