export interface LLMModelDefinition{ 
    id: string;
    name: string;
    provider: string; 
    description: string,
    maximumOutputTokens: number,
    maximumTemperature: number,
}