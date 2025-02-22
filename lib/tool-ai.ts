export interface ToolAI {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters?: {
            type: 'object';
            properties: Record<string, ToolPropertyAI>;
            required?: string[];
        };
    };
}

export interface ToolPropertyAI {
    type: 'string' | 'integer';
    enum?: string[]; // Optional enum for predefined values
    description: string;
}
