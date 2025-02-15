

export interface TaskDefinition {
    id?: number;
    isSystem: boolean;
    name: string;
    description: string;
    instructions: string;
    serverToolIds: string[];
}