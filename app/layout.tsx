import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/globals.css';
import Link from 'next/link';
import SignOutButton from './ui/sign-out-button';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Superexpert AI - Open source AI for everyone',
    description: 'Build powerful AI agents in minutes',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <nav className="flex items-center justify-between p-4 bg-gray-50">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <div className="text-lg font-semibold">Superexpert AI</div>
                        </Link>
                    </div>
                    <div>
                        <SignOutButton />
                    </div>
                </nav>
                {children}
            </body>
        </html>
    );
}
