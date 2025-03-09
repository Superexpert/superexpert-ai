import { Suspense } from 'react';
import CorporaList from '@/app/ui/corpora-list';
import { getCorporaListAction } from '@/lib/actions/admin-actions';

export default async function WisdomListPage() {

    const corpora = await getCorporaListAction();

    return (
        <main>
            <div>
                <Suspense
                    fallback={
                        <div className="h-72 w-full animate-pulse bg-gray-100" />
                    }>
                    <CorporaList
                        corpora={corpora}  />
                </Suspense>
            </div>
        </main>
    );
}
