
import OpenAI from 'openai';

export class OpenAIEmbeddingAdapter {

    public getEmbedding(input:string) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error(
                'OpenI API key not found. Please set the OPENAI_API_KEY environment variable.'
            );
        }
        const client = new OpenAI({ apiKey: apiKey });

        return client.embeddings.create({
            model: 'text-embedding-3-small',
            input: input,
        });
    }
}