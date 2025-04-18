import RegisterForm from '@/app/(admin)/ui/register-form';
import { Suspense } from 'react';

export default function LoginPage() {
    return (
        <main>
            <div>
                <Suspense>
                    <RegisterForm />
                </Suspense>
            </div>
        </main>
    );
}
