'use client';
import { useEffect, useRef, useState } from 'react';

type Row = {
  time: number;
  level: string;
  msg:   string;
  banner?: true;
  err?: { message: string };
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
};

export default function LogsClient({ agentName }: { agentName: string }) {
  const [rows, setRows] = useState<Row[]>(() => [{
    time: Date.now(),
    level: 'info',
    msg: 'Realtime logging started…',
    banner: true,
  }]);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let es: EventSource;
    const open = () => {
      es = new EventSource(`/api/logs/stream?agentName=${agentName}`);
      es.onmessage = e =>
        setRows(prev => [...prev.slice(-999), JSON.parse(e.data)]);
      es.onerror = () => {               // Vercel 5-min recycle or network drop
        es.close();
        setTimeout(open, 1000);          // reconnect after 1 s
      };
    };
    open();
    return () => es.close();
  }, [agentName]);

  useEffect(() => bottom.current?.scrollIntoView(), [rows]);


  
  return (
    <pre className="h-screen overflow-y-auto bg-black text-green-400 p-4 font-mono">
      {rows.map((r, i) => (
        <RowView key={`${r.time}-${i}`} row={r} />
      ))}
      <div ref={bottom} />
    </pre>
  );
}

function RowView({ row: r }: { row: Row }) {
  const { time, level, msg, banner, ...rest } = r;
  const extras = Object.keys(rest).length > 0 ? rest : null;
  const levelText = level ?? 'info';

  return (
    <div className={banner ? 'text-cyan-400 mb-1' : 'mb-0.5'}>
      <span className="text-gray-500">
        {new Date(time).toLocaleTimeString()}
      </span>{' '}
      <span className={color(levelText)}>{levelText.padEnd(5)}</span>{' '}
      {msg}
      {extras && (
        <details className="ml-2 inline">
          <summary className="cursor-pointer text-orange-400 inline before:content-['▶'] before:inline-block before:mr-1">
            details
          </summary>
          <pre className="whitespace-pre-wrap break-all bg-slate-800 p-2 rounded">
            {JSON.stringify(extras, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function color(level: string) {
  return level === 'error'
    ? 'text-red-400'
    : level === 'warn'
    ? 'text-yellow-400'
    : 'text-green-400';
}


