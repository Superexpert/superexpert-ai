import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import { ChunkAI } from '../chunk-ai';

export interface AIModel {
    generateResponse(inputMessages: MessageAI[], tools: ToolAI[], options?: object): AsyncGenerator<ChunkAI>;
}