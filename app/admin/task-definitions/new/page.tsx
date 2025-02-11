'use client';
import {useState, useEffect} from "react";
import Link from "next/link";
import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';


const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    instructions: z.string(),
});

interface IFormInput {
    name: string;
    instructions: string;
}

export default function AdminNewTaskDefinition() {

    useEffect(() => {
        const fetch = async () => {
        };
        fetch();
    }, []);


 
    const { register, handleSubmit, formState: { errors } } = useForm<IFormInput>({
        resolver: zodResolver(schema),
    });
      
    const onSubmit: SubmitHandler<IFormInput> = (data) => {
        // Handle form submission
    };

    return (
        <div>
            <h1>Task Definitions</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label>Task Name</label>
                    <input type="text" {...register('name')} />
                    {errors.name && <span>{errors.name.message}</span>}
                </div>

                <div>
                    <label>Instructions</label>
                    <textarea {...register('instructions')}></textarea>
                    {errors.instructions && <span>{errors.instructions.message}</span>}
                </div>

                <button className="btnPrimary" type="submit">Submit</button>
                <Link href="/admin">
                    <button className="btnCancel ml-4">Cancel</button>
                </Link>
            </form>

        </div>
    )

}