import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import { ChunkAI } from '@/lib/chunk-ai';
import { ModelConfiguration } from '@/lib/model-configuration';

export abstract class LLMAdapter {
    constructor(
        public modelId: string,
        public modelConfiguration?: ModelConfiguration
    ) {}

    // Map input messages to the format required by the LLM
    public abstract mapMessages(inputMessages: MessageAI[]): unknown[];

    // Map tools to the format required by the LLM
    public abstract mapTools(inputTools: ToolAI[]): unknown[];

    public abstract generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options?: object
    ): AsyncGenerator<ChunkAI>;

    protected async *retryWithBackoff<T>(
        operation: () => Promise<AsyncGenerator<T, any, any>>, // eslint-disable-line @typescript-eslint/no-explicit-any
        maxRetries: number = 3
    ): AsyncGenerator<T> {
        let retries = 0;

        while (retries <= maxRetries) {
            try {
                //console.log(`Attempt ${retries + 1}/${maxRetries + 1}`);

                // Call the operation and yield its results
                yield* await operation();
                return;
            } catch (error) {
                console.error(`Error on attempt ${retries + 1}:`, error);

                if (++retries > maxRetries) {
                    //console.error('Maximum retries reached.');
                    throw error;
                }

                //console.log(`Retrying in ${retries * 1000}ms...`);
                await new Promise((resolve) =>
                    setTimeout(resolve, retries * 1000)
                ); // Exponential backoff
            }
        }
    }
}
