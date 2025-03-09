'use client';
import { useState } from 'react';
import UploadForm from '@/app/ui/file-upload';
import DemoMode from '@/app/ui/demo-mode';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Corpus, corpusSchema } from '@/lib/corpus';



export default function WisdomForm() {

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<Corpus>({
        resolver: zodResolver(corpusSchema),
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
        


            <UploadForm />
        </div>
        </>
    );
}
