'use client';
import { useState } from 'react';
import DemoMode from '@/app/ui/demo-mode';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CorpusFile, corpusFileSchema } from '@/lib/corpus-file';



export default function CorpusFileForm() {

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CorpusFile>({
        resolver: zodResolver(corpusFileSchema),
        defaultValues: {
            chunkSize: 1024,
        },
    });


    return (
        <>
        <DemoMode />

        <div className="formCard">

            <div>
                <label>Chunk Size</label>
                <div>
                    Enter the size of the chunks in tokens. The maximum is 8,192.
                </div>
                <input
                    type="number"
                    className="input"
                    placeholder="Chunk Size"
                    min={1}
                    max={8192}
                    defaultValue={1024} />
                        {errors.chunkSize && (
                            <p className="error">
                                {errors.chunkSize.message}
                            </p>
                        )}
             </div>
        


        </div>
        </>
    );
}
