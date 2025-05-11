'use client';
import { useEffect, useRef, useState } from 'react';

type Row = {
    time: number; // Date.now() from logger
    level: string;
    msg: string;
    err?: { message: string };
    banner?: boolean;
};

export default function LogsClient({ agentName }: { agentName: string }) {
    const [rows, setRows] = useState<Row[]>(() => [
        {
            time: Date.now(),
            level: 'info',
            msg: 'Realtime logging started…',
            banner: true,
        },
    ]);
    const bottom = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const es = new EventSource(`/api/logs/stream?agentName=${agentName}`);
        es.onmessage = (e) => {
            setRows((prev) => [...prev.slice(-999), JSON.parse(e.data)]);
        };

        return () => es.close();
    }, [agentName]);

    useEffect(() => bottom.current?.scrollIntoView(), [rows]);

    const stripInlineKeys = (row: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {time, createdAt, level, msg, userId, agentId, component,
            ...rest
        } = row;
        return rest;
    };

    const hasDetails = (row: Record<string, unknown>) =>
        Object.keys(stripInlineKeys(row)).length > 0;

    return (
        <pre className="h-screen overflow-y-auto bg-black text-green-400 p-4 font-mono">
            {rows.map((r, i) => (
                <div
                    key={`${r.time}-${i}`}
                    className={r.banner ? 'text-cyan-400 mb-1' : 'mb-0.5'}>
                    <span className="text-gray-500">
                        {new Date(r.time).toLocaleTimeString()}
                    </span>{' '}
                    <span className={color(r.level)}>{r.level.padEnd(5)}</span>{' '}
                    {r.msg}
                    {!r.banner && hasDetails(r) && (
                        <details className="ml-2 inline">
                            <summary className="cursor-pointer text-orange-400 inline">
                                details
                            </summary>
                            <pre className="whitespace-pre-wrap break-all bg-slate-800 p-2 rounded">
                                {JSON.stringify(stripInlineKeys(r), null, 2)}
                            </pre>
                        </details>
                    )}
                </div>
            ))}
            <div ref={bottom} />
        </pre>
    );
}

function color(level: string) {
    switch (level) {
        case 'error':
            return 'text-red-400';
        case 'warn':
            return 'text-yellow-400';
        default:
            return 'text-green-400';
    }
}
