'use client';

const DemoMode = ({
    text = `You are in demo mode with reduced functionality. For the full experience, download 
            the open-source <a className="font-bold" href="https://github.com/superexpert/superexpert-ai">Superexpert AI</a> project from GitHub.
`,
}: {
    text?: string;
}) => {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (!isDemoMode) return;

    return (
        <div
            className="demoMode"
            dangerouslySetInnerHTML={{ __html: text }}></div>
    );
};

export default DemoMode;
