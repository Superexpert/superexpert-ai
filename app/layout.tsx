import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';
import Nav from './ui/nav';
import '@/superexpert-ai.plugins.server';

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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={plusJakartaSans.className}>
                <Nav />
                {children}
            </body>
        </html>
    );
}
