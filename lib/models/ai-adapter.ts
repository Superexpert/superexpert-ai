import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import { ChunkAI } from '../chunk-ai';

export abstract class AIAdapter {

    constructor(public modelId: string) {}


    public abstract generateResponse(
        instructions: string,
        inputMessages: MessageAI[],
        tools: ToolAI[],
        options?: object
    ): AsyncGenerator<ChunkAI>;

    protected async retryOperation<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delay: number = 1000,
        backoffFactor: number = 2
    ): Promise<T> {
        let attempt = 0;
        let currentDelay = delay;
    
        while (attempt < maxRetries) {
            try {
                return await operation();
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw error;
                }
                console.warn(`Attempt ${attempt} failed. Retrying in ${currentDelay}ms...`);
                await new Promise(res => setTimeout(res, currentDelay));
                currentDelay *= backoffFactor; // Exponential backoff
            }
        }
        throw new Error('Operation failed after maximum retries');
    }
}
