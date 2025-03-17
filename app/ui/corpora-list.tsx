import Link from 'next/link';
import DemoMode from '@/app/ui/demo-mode';

export default function CorporaList({
    corpora,
}: {
    corpora: {id:string;name:string;description:string}[];
}) {
    return (
        <>
            <DemoMode />

            <div className="formCard">
                <h1 className="mb-4">Corpora</h1>
                <p className="text-gray-600 mb-6">
                    All your big data.
                </p>

                <div className="space-y-4">
                    {corpora.map((cp) => (
                        <div
                            key={cp.id}
                            className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
                            <div>
                                <h2>{cp.name}</h2>
                                <div className="max-h-32 overflow-hidden line-clamp-3">
                                    {cp.description}
                                </div>
                            </div>
                            <div>
                                <Link
                                    href={`/admin/corpora/corpus/${cp.id}`}
                                    className="btn btnSecondary ml-4">
                                    Edit
                                </Link>
                                <Link
                                    href={`/admin/corpora/file/${cp.id}`}
                                    className="btn btnSecondary ml-4">
                                    Files
                                </Link>
                                <Link
                                    href={`/admin/corpora/query/${cp.id}`}
                                    className="btn btnSecondary ml-4">
                                    Test
                                </Link>

                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6">
                    <Link href="/admin/corpora/corpus" className="btn btnPrimary">
                        New Corpus
                    </Link>
                </div>
            </div>
        </>
    );
}
