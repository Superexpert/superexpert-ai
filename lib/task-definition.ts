

export interface TaskDefinition {
    id?: number;
    name: string;
    instructions: string;
    serverToolIds: string[];
}