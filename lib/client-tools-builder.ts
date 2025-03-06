'use client';
import plugins from '@/superexpert.plugins';
import { ClientContext } from '@/lib/client/client-context';

export class ClientToolsBuilder {
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

    public getClientTool(
        toolName: string
    ): { methodName: string; metadata: Record<string, any> } | null {
        for (const plugin of plugins.ClientTools) {
            const tools = this.filterMethods(plugin);
            const foundTool = tools.find(
                (tool) => tool.metadata.name === toolName
            );
            if (foundTool) {
                return foundTool;
            }
        }
        return null;
    }

    // public async callClientTool(
    //     toolName: string,
    //     toolParams: Record<string, any>
    // ) {
    //     const clientTools = plugins.ClientTools;

    //     for (const ToolClass of clientTools) {
    //         const toolInstance = new ToolClass();

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

    public async callClientTool(
        clientContext: ClientContext,
        toolName: string,
        toolParams: Record<string, any>
    ) {
        const clientTools = plugins.ClientTools;
    
        for (const ToolClass of clientTools) {
            const toolInstance = new ToolClass(clientContext);
    
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
    
                    // Create a mapping of expected parameter names to their index in function signature
                    const expectedParams = parameterMetadata.map((param: any) => param.name);
    
                    // Rearrange toolParams according to the expected parameter order
                    const args = expectedParams.map((paramName: string) => {
                        if (!(paramName in toolParams)) {
                            // Handle missing parameter; here we set it to undefined
                            return undefined;
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


}
