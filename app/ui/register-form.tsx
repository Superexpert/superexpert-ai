'use client';

import { useState } from 'react';
import { registerAction } from '@/lib/actions/server-actions';
import { RegisterUser, registerUserSchema } from '@/lib/register-user';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

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
        <div className="formCard">
            <form onSubmit={handleSubmit(onSubmit)}>
                <h1>Register</h1>
                <div>
                    {serverError && <p className="error">{serverError}</p>}
                </div>
                <div>
                    <label>Email</label>
                    <input
                        {...register('email')}
                        type="email"
                        placeholder="Enter your email address"
                    />
                    {errors.email && (
                        <p className="error">{errors.email.message}</p>
                    )}
                </div>
                <div>
                    <label>Password</label>
                    <input
                        {...register('password')}
                        type="password"
                        placeholder="Enter password"
                    />
                    {errors.password && (
                        <p className="error">{errors.password.message}</p>
                    )}
                </div>
                <button className="btn btnPrimary">Register</button>
                <div className="mt-4">
                    Already have an account? <Link href="/login">Login</Link>
                </div>
            </form>
        </div>
    );
}
