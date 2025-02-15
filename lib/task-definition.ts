

export interface TaskDefinition {
    id?: number;
    isSystem: boolean;
    name: string;
    description: string;
    instructions: string;
    serverDataIds: string[];
    serverToolIds: string[];
    clientToolIds: string[];
}