import { signOut } from '@/auth';

const SignOutButton = async () => {
    return (
        <form
        className="m-0 p-0"
            action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
            }}>
            <button className="text-base font-medium text-blue-600 hover:text-blue-800 focus:outline-none m-0 p-0">
                Sign Out
            </button>
        </form>
    );
};

export default SignOutButton;
