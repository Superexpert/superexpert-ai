import { useState } from 'react';
import { queryCorpusAction } from '@/lib/actions/admin-actions';

export default function CorpusQuery({ corpusId }: { corpusId: string }) {
    const [query, setQuery] = useState('');
    const [limit, setLimit] = useState<number>(3);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await queryCorpusAction(corpusId, query, limit);
        console.log(result);
    }

        return (
            <div>
                <form onSubmit={handleSubmit}>
                    <h1>Test Query</h1>
                    <div>
                        <label>Limit</label>
                        <select onChange={(e) => setLimit(parseInt(e.target.value))}>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                        </select>
                    </div>
                    <div>
                        <label>Query</label>
                        <input type="text" onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <button className="btn btnPrimary">Search</button>
                </form>
            </div>
        );
}
