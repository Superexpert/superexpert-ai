'use client';
import { useState } from 'react';
import { authenticateAction } from '@/lib/actions/server-actions';
//import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { RegisterUser, registerUserSchema } from '@/lib/register-user';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function LoginForm() {
    const [serverError, setServerError] = useState('');
    const router = useRouter();
    //const searchParams = useSearchParams();
    //const callbackUrl = searchParams.get('callbackUrl') || '/';
    const callbackUrl = '/';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterUser>({
        resolver: zodResolver(registerUserSchema),
    });

    const onSubmit = async (registerUser: RegisterUser) => {
        const result = await authenticateAction(registerUser);
        console.log('Astro 1', result);

        if (result.success) {
            console.log('Astro 2');
            router.push(callbackUrl);
            console.log('Astro 3');

        } else {
            console.log('Astro 4');

            setServerError(result.serverError);
        }
    };

    return (
        <div className="formCard">
            <h1>Log In</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                    {serverError && <p className="error">{serverError}</p>}
                </div>
                <div>
                    <label htmlFor="email">Email</label>
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
                    <label htmlFor="password">Password</label>
                    <input
                        {...register('password')}
                        type="password"
                        placeholder="Enter password"
                    />
                    {errors.password && (
                        <p className="error">{errors.password.message}</p>
                    )}
                </div>
                <button className="btn btnPrimary">Log in </button>
            </form>
            <div className="mt-4">
                Don&apos;t have an account? <Link href="/register">Register</Link>
            </div>
        </div>
    );
}