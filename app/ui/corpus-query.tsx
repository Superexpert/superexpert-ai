import { useState } from 'react';
import { queryCorpusAction } from '@/lib/actions/admin-actions';

export default function CorpusQuery({ corpusId }: { corpusId: string }) {
    const [query, setQuery] = useState('');
    const [limit, setLimit] = useState<number>(3);
    const [similarityThreshold, setSimilarityThreshold] = useState<number>(50);
    const [matches, setMatches] = useState<string[]|null>(null);


 // Handle limit change with validation
 const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only update if the value is valid
    if (value === '') {
        // Keep previous value for empty input
        return;
    }
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
        setLimit(parsed);
    }
};

// Handle similarity threshold change with validation
const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only update if the value is valid
    if (value === '') {
        // Keep previous value for empty input
        return;
    }
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
        setSimilarityThreshold(parsed);
    }
};

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const results = await queryCorpusAction(
            corpusId,
            query,
            limit,
            similarityThreshold
        );
        setMatches(results);
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h1>Test Query</h1>
                <div>
                    <label>Limit</label>
                    <input
                        defaultValue={limit}
                        onChange={handleLimitChange}
                        type="number"
                        min={1}
                        max={100}
                        step={1}                        
                    />
                </div>
                <div>
                    <label>Similarity Threshold</label>
                    <input
                        defaultValue={similarityThreshold}
                        onChange={handleThresholdChange}
                        type="number"
                        min={5}
                        max={100}
                        step={5}
                    />
                </div>
                <div>
                    <label>Query</label>
                    <input
                        type="text"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button className="btn btnPrimary">Search</button>
            </form>

            {/* Display results here */}
            {matches === null && <p>Enter a query to search</p>}

            {matches && matches.length === 0 && (
                <p>No matches found</p>
            )}

            {matches && matches.length > 0 && (
                <div>
                    <h2>Matches</h2>
                    <div>
                        {matches.map((match) => (
                            <div className="mt-6 break-all bg-slate-100" key={match}>
                                {match}
                            </div>
                        ))}
                    </div>   
                </div>
            )}
        </div>
    );
}
