
import { registerRAGStrategy, CorpusQueryResult } from '@superexpert-ai/framework';
import { Prisma, PrismaClient } from '@prisma/client';
import { removeStopwords } from 'stopword';
import { Tsquery } from 'pg-tsquery';

registerRAGStrategy({
    id: 'keyword',
    name: 'Keyword Search',
    category: 'system',
    description: 'Uses keyword search to find relevant documents based on exact matches.',
    function: async function(): Promise<CorpusQueryResult[]> {

        const { sql: tsQuery, tokens } = await buildKeywordQuery(
            this.db,
            this.query,
            this.corpusIds
        );
    
        console.log('query', this.query);
        console.log('tsQuery', tsQuery);
    
        const rows = await this.db.$queryRaw<
            {
                id: number;
                chunk: string;
                fileName: string;
                hits: number;
                rank: number;
            }[]
        >`
            WITH q_terms AS (
            SELECT ${tokens}::text[] AS arr            -- ← array literal passed by Prisma
            )
            SELECT  cfc.id,
                    cfc.chunk,
                    (
                    SELECT COUNT(*)                    -- hits = coverage
                    FROM (
                        SELECT unnest((SELECT arr FROM q_terms))
                        INTERSECT
                        SELECT unnest(tsvector_to_array(cfc."chunkTSV"))
                    ) AS x
                    )                       AS hits,
                    ts_rank_cd(cfc."chunkTSV", ${tsQuery}, 4|8) AS rank
            FROM    "superexpert_ai_corpusFileChunks" AS cfc
            JOIN    "superexpert_ai_corpusFiles"      AS cf
                ON cfc."corpusFileId" = cf.id
            WHERE   cf."corpusId" IN (${Prisma.join(this.corpusIds)})
            AND   cfc."userId"  = ${this.userId}
            AND   cfc."chunkTSV" @@ ${tsQuery}
            ORDER  BY hits DESC, rank DESC
            LIMIT  ${this.limit};
        `;
    
        console.log('rows', rows);
    
        const max = Math.max(0, ...rows.map((r) => r.rank));
        return rows.map((r) => ({ ...r, similarity: max ? r.rank / max : 0 }));       
    },
});




   /**
     * Build:   anchor & (token2 | token3 | …)
     * Rarest (lowest ndoc across the selected corpora) becomes the anchor.
     */

   async function buildKeywordQuery(
    db: PrismaClient,
    raw: string,
    corpusIds: string[]
): Promise<{ sql: Prisma.Sql; tokens: string[] }> {
    /* 1️⃣  tokenise -------------------------------------------------------- */
    const tokens = removeStopwords(
        raw
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
    );
    if (!tokens.length) return { sql: Prisma.sql`''::tsquery`, tokens: [] };

    /* 2️⃣  get Σ-document-frequency for each token ------------------------ */
    const freqs = await db.corpusTermFrequencies.groupBy({
        by: ['lexeme'],
        where: { corpusId: { in: corpusIds }, lexeme: { in: tokens } },
        _sum: { ndoc: true },
    });
    const ndoc = Object.fromEntries(
        freqs.map((f) => [f.lexeme, f._sum!.ndoc ?? 0])
    );

    /* 3️⃣  pick rarest token as anchor ------------------------------------ */
    tokens.sort(
        (a, b) => (ndoc[a] ?? 1e9) - (ndoc[b] ?? 1e9) || b.length - a.length
    );
    const anchor = tokens.shift()!; // rarest
    const rest = tokens; // remaining tokens

    /* 4️⃣  build Boolean expression --------------------------------------- */
    let expr: string;
    if (rest.length === 0) {
        expr = anchor; // e.g. bertha
    } else if (rest.length === 1) {
        expr = `${anchor} | ${rest[0]}`; // bertha | old
    } else {
        expr = `${anchor} (${rest.join(',')})`; // icard (cabin,miss)
    }

    const tsText = new Tsquery().parseAndStringify(expr); // commas ⇒ OR, space ⇒ AND
    return {
        sql: Prisma.sql`to_tsquery('english', ${tsText})`,
        tokens: [anchor, ...rest], // for coverage count
    };
}

