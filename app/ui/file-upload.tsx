'use client';

import React, { useState } from 'react';
import { createCorpusAction, uploadChunkAction } from '@/lib/actions/server-actions';

const CHUNK_SIZE = 30000; // 500 characters (approximate in UTF-8)

const FileUpload: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setUploadProgress(0);

      // Create new corpus
      const corpusId = await createCorpusAction(file.name);

      const reader = file.stream().getReader();
      const decoder = new TextDecoder('utf-8');

      let uploadedChunks = 0;
      let accumulatedText = '';
      let chunkIndex = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (accumulatedText) {
            // Send last accumulated chunk if remaining
            await sendChunk(corpusId, accumulatedText, chunkIndex, file.name);
            uploadedChunks++;
          }
          break;
        }

        accumulatedText += decoder.decode(value, { stream: true });

        // Send accumulated chunks in ~500-char chunks
        while (accumulatedText.length >= CHUNK_SIZE) {
          const chunk = accumulatedText.slice(0, CHUNK_SIZE);
          accumulatedText = accumulatedText.slice(CHUNK_SIZE);

          await sendChunk(corpusId, chunk, chunkIndex, file.name);
          chunkIndex++;
          uploadedChunks++;

          const progress = Math.round((uploadedChunks * CHUNK_SIZE / file.size) * 100);
          setUploadProgress(Math.min(progress, 100));
        }
      }

      setUploadProgress(100);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  async function sendChunk(corpusId:string, chunk: string, index: number, fileName: string) {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', index.toString());
    formData.append('fileName', fileName);

    console.log("UploadChunAction");
    console.log(corpusId);
    console.log(formData);
    await uploadChunkAction(corpusId, formData);
  }

  return (
    <div className="p-4 border rounded-md">
      <input type="file" onChange={handleUpload} />

      {uploadProgress > 0 && (
        <div className="mt-2">
          <progress value={uploadProgress} max="100" className="w-full" />
          <p>{uploadProgress}% uploaded</p>
        </div>
      )}

      {error && <div className="mt-2 text-red-500">Error: {error}</div>}
    </div>
  );
};

export default FileUpload;