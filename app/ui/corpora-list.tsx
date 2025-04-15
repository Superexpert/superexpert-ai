import Link from 'next/link';
import DemoMode from '@/app/ui/demo-mode';

export default function CorporaList({
    corpora,
}: {
    corpora: { id: string; name: string; description: string }[];
}) {
    return (
        <>
            <DemoMode />

            <div className="pageContainer">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="pageHeader">Corpora</h1>
                        <p className="text-gray-600">
                            A corpus contains a set of files that can be
                            semantically searched.
                        </p>
                    </div>
                    <Link href="/admin/corpora/corpus" className="btnPrimary">
                        <span className="inline sm:hidden">New</span>
                        <span className="hidden sm:inline">New Corpora</span>
                    </Link>
                </div>

                <div className="pageCard">
                    {corpora.map((cp) => (
                        <div
                            key={cp.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2 sm:gap-y-0 p-4 rounded-xl bg-white shadow-sm">
                            <div className="flex-1">
                                <h2 className="text-base font-bold text-neutral-900">
                                    {cp.name}
                                </h2>
                                <p className="mt-1 text-gray-500 text-sm leading-snug">
                                    {cp.description}
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-0 flex space-x-2">
                                <Link
                                    href={`/admin/corpora/corpus/${cp.id}`}
                                    className="btnSecondary">
                                    Edit
                                </Link>
                                <Link
                                    href={`/admin/corpora/file/${cp.id}`}
                                    className="btnSecondary">
                                    Files
                                </Link>
                                <Link
                                    href={`/admin/corpora/query/${cp.id}`}
                                    className="btnSecondary">
                                    Test
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
