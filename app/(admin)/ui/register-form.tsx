'use client';

import { useState } from 'react';
import { registerAction } from '@/lib/actions/server-actions';
import { RegisterUser, registerUserSchema } from '@/lib/register-user';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { FormField } from '@/app/(admin)/ui/form-field';

export default function RegisterForm() {
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterUser>({
        resolver: zodResolver(registerUserSchema),
    });

    const onSubmit = async (registerUser: RegisterUser) => {
        const result = await registerAction(registerUser);
        if (result.success) {
            window.location.href = '/';
        } else {
            setServerError(result.serverError);
        }
    };

    return (
        <div className="pageContainer">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="pageHeader">Register</h1>
                </div>
            </div>

            <form className="pageCard" onSubmit={handleSubmit(onSubmit)}>
                <div>
                    {serverError && <p className="error">{serverError}</p>}
                </div>

                <FormField
                    label="Email"
                    htmlFor="email"
                    error={errors.email?.message}
                    instructions="Enter your email address">
                    <input id="email" type="email" {...register('email')} />
                </FormField>

                <FormField
                    label="Password"
                    htmlFor="password"
                    error={errors.password?.message}
                    instructions="Enter a password">
                    <input
                        id="password"
                        type="password"
                        {...register('password')}
                    />
                </FormField>

                <div className="flex gap-4 mt-10 pt-4 border-t border-neutral-100">
                    <button className="btn btnPrimary">Register</button>
                </div>
                <div className="mt-4">
                    Already have an account? <Link href="/login">Login</Link>
                </div>
            </form>
        </div>
    );
}
