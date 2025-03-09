import { useState } from 'react';
import { createCorpusAction, uploadChunkAction } from '@/lib/actions/server-actions';
import { encodingForModel } from 'js-tiktoken';



//const MAX_TOKENS = 8192; // Define the maximum token limit
const MAX_TOKENS = 100; // Define the maximum token limit

const FileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');


  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create new corpus
    const corpusId = await createCorpusAction(file.name);

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
            await sendChunk(corpusId, accumulatedText, chunkIndex, file.name, tokens.length);
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
        while (accumulatedTokens.length >= MAX_TOKENS) {
          // Extract the chunk corresponding to MAX_TOKENS
          const chunkTokens = accumulatedTokens.slice(0, MAX_TOKENS);
          const chunkText = encoding.decode(chunkTokens);

          // Send the chunk
          await sendChunk(corpusId, chunkText, chunkIndex, file.name, chunkTokens.length);
          totalSizeUploaded += chunkText.length;
          chunkIndex++;

          // Update the accumulated text and tokens to remove the processed chunk
          accumulatedText = accumulatedText.slice(chunkText.length);
          accumulatedTokens = accumulatedTokens.slice(MAX_TOKENS);

          // Update upload progress
          const progress = Math.round((totalSizeUploaded / file.size) * 100);
          setUploadProgress(Math.min(progress, 100));
        }
      }

      setUploadProgress(100);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      //encoding.free();
    }
  };

  const sendChunk = async (corpusId: string, chunk:string, index:number, fileName:string, tokenCount:number) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', index.toString());
    formData.append('fileName', fileName);

    await uploadChunkAction(corpusId, formData);
    console.log(`Chunk ${index} sent, size: ${chunk.length} characters, tokenCount: ${tokenCount}`);
    //console.log(chunk);
  };

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

// 'use client';
// import React, { useState } from 'react';
// import { createCorpusAction, uploadChunkAction } from '@/lib/actions/server-actions';


// //const CHUNK_SIZE = 8192; // token limit for text-embedding-3-small
// const CHUNK_SIZE = 500; // character limit for text-embedding-3-small

// const FileUpload: React.FC = () => {
//   const [uploadProgress, setUploadProgress] = useState<number>(0);
//   const [error, setError] = useState<string>('');

//   const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     const { encoding_for_model } = await import('tiktoken');
//     const encoding = encoding_for_model('text-embedding-3-small');


//     try {
//       setError('');
//       setUploadProgress(0);

//       // Create new corpus
//       const corpusId = await createCorpusAction(file.name);

//       const reader = file.stream().getReader();
//       const decoder = new TextDecoder('utf-8');

//       let uploadedChunks = 0;
//       let accumulatedText = '';
//       let chunkIndex = 0;
//       let tokenCount = 0;

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) {
//           if (accumulatedText) {
//             // Send last accumulated chunk if remaining
//             await sendChunk(corpusId, accumulatedText, chunkIndex, file.name);
//             uploadedChunks++;
//           }
//           break;
//         }

//         accumulatedText += decoder.decode(value, { stream: true });
//         tokenCount = encoding.encode(accumulatedText).length;
//         console.log("tokenCount:", tokenCount);

//         // Send accumulated chunks in ~500-char chunks
//         while (tokenCount >= CHUNK_SIZE) {
//           const chunk = accumulatedText.slice(0, CHUNK_SIZE);
//           accumulatedText = accumulatedText.slice(CHUNK_SIZE);
//           tokenCount = encoding.encode(accumulatedText).length;
//           console.log("inner tokenCount:", tokenCount);

//           await sendChunk(corpusId, chunk, chunkIndex, file.name);
//           chunkIndex++;
//           uploadedChunks++;

//           const progress = Math.round((uploadedChunks * CHUNK_SIZE / file.size) * 100);
//           setUploadProgress(Math.min(progress, 100));
//         }
//       }

//       setUploadProgress(100);
//     } catch (err) {
//       console.error('Upload error:', err);
//       setError(err instanceof Error ? err.message : 'An unknown error occurred');
//     } finally {
//       encoding.free();
//     }
//   };

//   async function sendChunk(corpusId:string, chunk: string, index: number, fileName: string) {
//     const formData = new FormData();
//     formData.append('chunk', chunk);
//     formData.append('chunkIndex', index.toString());
//     formData.append('fileName', fileName);

//     await uploadChunkAction(corpusId, formData);
//   }

//   return (
//     <div className="p-4 border rounded-md">
//       <input type="file" onChange={handleUpload} />

//       {uploadProgress > 0 && (
//         <div className="mt-2">
//           <progress value={uploadProgress} max="100" className="w-full" />
//           <p>{uploadProgress}% uploaded</p>
//         </div>
//       )}

//       {error && <div className="mt-2 text-red-500">Error: {error}</div>}
//     </div>
//   );
// };

// export default FileUpload;