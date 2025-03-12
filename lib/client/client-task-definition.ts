export interface ClientTaskDefinition {
    id: string;
    isSystem: boolean;
    name: string;
    description: string;
    startNewThread: boolean;
    modelId: string;
    theme: string;
}