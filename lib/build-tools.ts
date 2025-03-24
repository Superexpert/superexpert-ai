import 'reflect-metadata';
import {
    ToolAI,
    ToolPropertyAI,
    getServerTools,
    getClientTools
} from '@superexpert-ai/framework';

export function buildTools(toolIds:string[]): ToolAI[] {
    // It does not make sense to distinguish between server and client tools here,
    // as we want to build a unified list of tools based on the provided toolIds.
    // Therefore, we combine the tools from both server and client.
    // This allows us to filter and return only the tools that match the provided toolIds.
    // And, yes, there can be naming collisions between server and client tools, but we assume that
    // the toolIds provided will be unique and valid for the context in which they are used.
    const allTools = [
        ...Object.values(getServerTools()),
        ...Object.values(getClientTools())
    ];
    const filteredTools = Object.values(allTools).filter((tool) =>
        toolIds.includes(tool.name)
    );

    return filteredTools.map((tool) => {
        const properties: Record<string, ToolPropertyAI> = {};
        const required: string[] = [];
        if (tool.parameters) {
            for (const param of tool.parameters) {
                properties[param.name] = {
                    type: param.type,
                    description: param.description,
                    ...(param.enum ? { enum: param.enum } : {}),
                    ...(param.default !== undefined ? { default: param.default } : {})
                };
                // Default to required unless explicitly set to false
                if (param.required !== false) {
                    required.push(param.name);
                }
            }
        }

        return {
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties,
                    ... (required.length > 0 ? { required } : {}),
                },
            },
        } as ToolAI;
    });
}
