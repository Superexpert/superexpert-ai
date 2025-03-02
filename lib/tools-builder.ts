import 'reflect-metadata';
import { ToolAI, ToolPropertyAI } from '@/lib/tool-ai';
import plugins from '@/superexpert.plugins';
import { prisma } from '@/lib/db/prisma';
import { User } from '@/lib/user';

export class ToolsBuilder {
    private filterMethods(targetClass: any) {
        const prototype = targetClass?.prototype;
        if (!prototype) {
            return [];
        }
        return Object.getOwnPropertyNames(prototype)
            .filter((method) => method !== 'constructor') // Ignore constructor
            .filter((method) => Reflect.hasMetadata('tool', prototype, method))
            .map((method) => ({
                methodName: method,
                metadata: Reflect.getMetadata('tool', prototype, method),
            }));
    }

    public getDecoratedServerDataMethods() {
        const methods: any[] = [];
        plugins.ServerData.forEach((plugin) => {
            const tools = this.filterMethods(plugin);
            methods.push(...tools);
        });
        return methods;
    }

    public getDecoratedServerToolMethods() {
        const methods: any[] = [];
        plugins.ServerTools.forEach((plugin) => {
            const tools = this.filterMethods(plugin);
            methods.push(...tools);
        });
        return methods;
    }

    public getDecoratedClientToolMethods() {
        const methods: any[] = [];
        plugins.ClientTools.forEach((plugin) => {
            const tools = this.filterMethods(plugin);
            methods.push(...tools);
        });
        return methods;
    }

    private filterParameters(targetClass: any) {
        const prototype = targetClass?.prototype;
        if (!prototype) {
            return [];
        }
        return Object.getOwnPropertyNames(prototype)
            .filter((method) => method !== 'constructor')
            .filter((method) =>
                Reflect.hasMetadata('tool-parameters', prototype, method)
            )
            .map((method) => ({
                methodName: method,
                parameters: Reflect.getMetadata(
                    'tool-parameters',
                    prototype,
                    method
                ),
            }));
    }

    public getDecoratedServerToolParameters() {
        const params: any[] = [];
        plugins.ServerTools.forEach((plugin) => {
            const pluginParams = this.filterParameters(plugin);
            params.push(...pluginParams);
        });
        return params;
    }

    public getDecoratedClientToolParameters() {
        const params: any[] = [];
        plugins.ClientTools.forEach((plugin) => {
            const pluginParams = this.filterParameters(plugin);
            params.push(...pluginParams);
        });
        return params;
    }

    public getServerDataList() {
        const tools = this.getDecoratedServerDataMethods();
        return tools.map((tool) => ({
            id: tool.metadata.name,
            description: `${tool.metadata.name} - ${tool.metadata.description}`,
        }));
    }

    public getServerToolList() {
        const tools = this.getDecoratedServerToolMethods();
        return tools.map((tool) => ({
            id: tool.metadata.name,
            description: `${tool.metadata.name} - ${tool.metadata.description}`,
        }));
    }

    public getClientToolList() {
        const tools = this.getDecoratedClientToolMethods();
        return tools.map((tool) => ({
            id: tool.metadata.name,
            description: `${tool.metadata.name} - ${tool.metadata.description}`,
        }));
    }

    public getTools(toolIds: string[]): ToolAI[] {
        const allTools = [
            ...this.getDecoratedServerToolMethods(),
            ...this.getDecoratedClientToolMethods(),
        ];

        const allToolParams = [
            ...this.getDecoratedServerToolParameters(),
            ...this.getDecoratedClientToolParameters(),
        ];

        // Only include tools that correspond to the current task or global task
        const filteredTools = allTools.filter((tool) =>
            toolIds.includes(tool.metadata.name)
        );

        return filteredTools.map((tool) => {
            const params: {
                name: string;
                description: string;
                type: string;
                optional?: boolean;
            }[] =
                allToolParams.find((tp) => tp.methodName === tool.methodName)
                    ?.parameters || [];

            const properties: Record<string, ToolPropertyAI> = {};
            const requiredParams: string[] = [];

            params.forEach((param) => {
                properties[param.name] = {
                    type: this.mapType(param.type),
                    description: param.description,
                };
                // Only add to requiredParams if it's not optional
                if (!param.optional) {
                    requiredParams.push(param.name);
                }
            });

            return {
                type: 'function',
                function: {
                    name: tool.metadata.name,
                    description: tool.metadata.description,
                    parameters: {
                        type: 'object',
                        properties,
                        required:
                            requiredParams.length > 0
                                ? requiredParams
                                : undefined,
                    },
                },
            } as ToolAI;
        });
    }

    private mapType(type: string): 'string' | 'integer' {
        // Map JavaScript/TypeScript types to OpenAI compatible types
        switch (type.toLowerCase()) {
            case 'number':
            case 'integer':
                return 'integer';
            default:
                return 'string'; // Default to string if type is unknown
        }
    }

    // public async callServerTool(
    //     user: User,
    //     toolName: string,
    //     toolParams: Record<string, any>
    // ) {
    //     const serverTools = plugins.ServerTools;

    //     for (const ToolClass of serverTools) {
    //         const toolInstance = new ToolClass(user, prisma);

    //         // Iterate through the methods of the class
    //         const methodNames = Object.getOwnPropertyNames(
    //             ToolClass.prototype
    //         ).filter((method) => method !== 'constructor');

    //         for (const methodName of methodNames) {
    //             const metadata = Reflect.getMetadata(
    //                 'tool',
    //                 ToolClass.prototype,
    //                 methodName
    //             );

    //             if (metadata && metadata.name === toolName) {
    //                 // Get method reference
    //                 const method = (toolInstance as any)[methodName];

    //                 if (typeof method === 'function') {
    //                     // Call the tool method with arguments
    //                     const args = Object.values(toolParams);
    //                     return await method.apply(toolInstance, args);
    //                 }
    //             }
    //         }
    //     }

    //     throw new Error(`Tool '${toolName}' not found.`);
    // }

    public async callServerTool(
        user: User,
        toolName: string,
        toolParams: Record<string, any>
    ) {
        const serverTools = plugins.ServerTools;
    
        for (const ToolClass of serverTools) {
            const toolInstance = new ToolClass(user, prisma);
    
            // Iterate through the methods of the class
            const methodNames = Object.getOwnPropertyNames(ToolClass.prototype)
                .filter((method) => method !== 'constructor');
    
            for (const methodName of methodNames) {
                const metadata = Reflect.getMetadata(
                    'tool',
                    ToolClass.prototype,
                    methodName
                );
    
                if (metadata && metadata.name === toolName) {
                    // Retrieve the parameter metadata
                    const parameterMetadata = Reflect.getMetadata(
                        'tool-parameters',
                        ToolClass.prototype,
                        methodName
                    ) || [];
    
                    if (!parameterMetadata.length) {
                        throw new Error(`No parameter metadata found for tool '${toolName}'.`);
                    }
    
                    // Create a mapping of expected parameter names to their index in function signature
                    const expectedParams = parameterMetadata.map((param: any) => param.name);
    
                    // Rearrange toolParams according to the expected parameter order
                    const args = expectedParams.map((paramName:string) => {
                        if (!(paramName in toolParams)) {
                            throw new Error(`Missing parameter '${paramName}' for tool '${toolName}'.`);
                        }
                        return toolParams[paramName];
                    });
    
                    // Get method reference
                    const method = (toolInstance as any)[methodName];
    
                    if (typeof method === 'function') {
                        return await method.apply(toolInstance, args);
                    }
                }
            }
        }
    
        throw new Error(`Tool '${toolName}' not found.`);
    }


    public async callServerData(user: User, toolName: string) {
        const serverData = plugins.ServerData;

        // Form constructor args
        const db = prisma;

        for (const ToolClass of serverData) {
            const toolInstance = new ToolClass(user, db);

            // Iterate through the methods of the class
            const methodNames = Object.getOwnPropertyNames(
                ToolClass.prototype
            ).filter((method) => method !== 'constructor');

            for (const methodName of methodNames) {
                const metadata = Reflect.getMetadata(
                    'tool',
                    ToolClass.prototype,
                    methodName
                );

                if (metadata && metadata.name === toolName) {
                    // Get method reference
                    const method = (toolInstance as any)[methodName];

                    if (typeof method === 'function') {
                        // Call the tool method with arguments
                        const result = await method.apply(toolInstance);
                        return String(result); // ensure that result is a string (even nulls and undefineds)
                    }
                }
            }
        }

        throw new Error(`Tool '${toolName}' not found.`);
    }
}
