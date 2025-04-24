import Bottleneck from 'bottleneck';
import { OpenAI } from 'openai';

const limiter = new Bottleneck({
    reservoir: 90_000,
    reservoirRefreshInterval: 60_000,
    maxConcurrent: 2,
    minTime: 1000 / 1_000,
});

export class OpenAIEmbeddingAdapter {
    private openai: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error(
                'OpenI API key not found. Please set the OPENAI_API_KEY environment variable.'
            );
        }
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    public async getEmbedding(text: string, tokens: number=1) {
        return limiter.schedule({ weight: tokens }, async () => {
            const { data } = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
            });
            return data[0].embedding as number[];
        });
    }
}


// import OpenAI from 'openai';

// export class OpenAIEmbeddingAdapter {

//     public getEmbedding(input:string) {
//         const apiKey = process.env.OPENAI_API_KEY;
//         if (!apiKey) {
//             throw new Error(
//                 'OpenI API key not found. Please set the OPENAI_API_KEY environment variable.'
//             );
//         }
//         const client = new OpenAI({ apiKey: apiKey });

//         return client.embeddings.create({
//             model: 'text-embedding-3-small',
//             input: input,
//         });
//     }
// }
