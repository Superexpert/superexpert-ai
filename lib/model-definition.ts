export interface ModelDefinition{ 
    name: string;
    provider: string; 
    id: string, 
    description: string,
    maximumOutputTokens: number,
    maximumTemperature: number,
}