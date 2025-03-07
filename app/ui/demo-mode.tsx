'use client';

const DemoMode = () => {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (!isDemoMode) return;

    return (
        <div className="demoMode">
            You are in demo mode. This means that all agents will be deleted
            automatically after a certain number of days. Also,
            model selection will be ignored and all tasks will run using 
            GPT-4o mini. For the full experience, download 
            Superexpert AI.
        </div>
    );
};

export default DemoMode;
