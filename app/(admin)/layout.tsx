import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/app/(admin)/admin.css';
import Nav from './ui/nav';
import '@/superexpert-ai.plugins.server';
import { auth } from '@/auth';

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '700'], // Adjust weights as needed
    variable: '--font-plus-jakarta-sans',
    display: 'swap',
  });

export const metadata: Metadata = {
    title: 'Superexpert AI - Open Source AI Made Simple',
    description: 'Build powerful AI agents in minutes',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();

    return (
        <html lang="en">
            <body
                className={plusJakartaSans.className}>
                <Nav user={session?.user ?? null} />
                {children}
            </body>
        </html>
    );
}
