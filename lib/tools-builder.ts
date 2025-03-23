import 'reflect-metadata';
import {
    ToolAI,
    ToolPropertyAI,
    getServerTools,
    getClientTools
} from '@superexpert-ai/framework';

export function getTools(toolIds:string[]): ToolAI[] {
    const allTools = [
        ...Object.values(getServerTools()),
        ...Object.values(getClientTools())
    ];
    const filteredTools = Object.values(allTools).filter((tool) =>
        toolIds.includes(tool.name)
    );

    return filteredTools.map((tool) => {
        const properties: Record<string, ToolPropertyAI> = {};
        for (const param of tool.parameters) {
            properties[param.name] = {
                type: 'string',
                description: param.description,
            };
        }

        return {
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties,
                },
            },
        } as ToolAI;
    });
}
