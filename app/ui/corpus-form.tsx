'use client';
import { useState } from 'react';
import UploadForm from '@/app/ui/file-upload';
import DemoMode from '@/app/ui/demo-mode';

export default function WisdomForm() {

    return (
        <>
        <DemoMode />

        <div className="formCard">
            <UploadForm />
        </div>
        </>
    );
}
