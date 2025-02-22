export type MessageAI =
    | UserMessageAI
    | ToolMessageAI
    | AssistantMessageAI
    | SystemMessageAI;

export interface UserMessageAI {
    role: 'user';
    content: string;
    name?: string;
}

export interface ToolMessageAI {
    role: 'tool';
    content: string;
    tool_call_id: string;
}

export interface AssistantMessageAI {
    role: 'assistant';
    content: string;
    tool_calls?: ToolCall[];
}

export interface SystemMessageAI {
    role: 'system';
    content: string;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
