import { auth } from '@/auth';
import Link from 'next/link';
import SignOutButton from '@/app/ui/sign-out-button';

export default async function Nav() {
    const session = await auth();
    return (
        <nav className="flex items-center justify-between p-4 bg-gray-50">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <div className="text-lg font-semibold">Superexpert AI</div>
                </Link>
            </div>
            {session && (
                <div className="flex items-center gap-4">
                    <Link href="/">Agents</Link>
                    <Link href="/admin/corpora">Corpora</Link>
                    <SignOutButton />
                </div>
            )}
        </nav>
    );
}
