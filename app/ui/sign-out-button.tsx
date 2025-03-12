import { signOut } from '@/auth';
import { auth } from '@/auth';

const SignOutButton = async () => {
    const session = await auth();

    if (!session) return;

    return (
        <form
            action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
            }}>
            <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
                <div>Sign Out</div>
            </button>
        </form>
    );
};

export default SignOutButton;
