import { Suspense } from 'react';
import CorporaList from '@/app/ui/corpora-list';
import { getCorporaListAction } from '@/lib/actions/admin-actions';
import { redirect } from 'next/navigation';

export default async function WisdomListPage() {
    const corpora = await getCorporaListAction();
    // If the uer does not have any corpora, redirect to the corpora page
    if (corpora.length === 0) {
        redirect('/admin/corpora/corpus');
    }

    return (
        <main>
            <div>
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <CorporaList corpora={corpora} />
                </Suspense>
            </div>
        </main>
    );
}
