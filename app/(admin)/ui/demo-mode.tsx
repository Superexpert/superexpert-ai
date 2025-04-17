'use client';

export default function DemoMode({
    text = `You are in demo mode with reduced functionality. For the full experience, download the open-source <a href="https://github.com/superexpert/superexpert-ai" target="_blank" rel="noopener noreferrer" class="underline font-medium text-blue-600 hover:text-blue-700 transition">Superexpert AI</a> project from GitHub.`,
}: {
    text?: string;
}) {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (!isDemoMode) return null;

    return (
        <div className="demoMode" dangerouslySetInnerHTML={{ __html: text }} />
    );
}
