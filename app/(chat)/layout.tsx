import type { Metadata } from 'next';
import '@/app/(chat)/chat.css';
import '@/superexpert-ai.plugins.server';

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
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className="flex flex-col min-h-screen">
                {children}
            </body>
        </html>
    );
}
