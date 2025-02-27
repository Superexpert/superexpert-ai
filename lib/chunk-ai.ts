

export interface ChunkAI {
    text?: string;
    toolCall?: {
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: any;
        }
    }
}