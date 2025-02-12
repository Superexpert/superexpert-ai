
'use client';

export class ClientToolsBuilder {

    private filterMethods(targetClass: any) {
        const prototype = targetClass?.prototype;
        if (!prototype) {
          return [];
        }
        return Object.getOwnPropertyNames(prototype)
            .filter(method => method !== 'constructor') // Ignore constructor
            .filter(method => Reflect.hasMetadata('tool', prototype, method))
            .map(method => ({
                methodName: method,
                metadata: Reflect.getMetadata('tool', prototype, method)
            }));
      }

    public getDecoratedGlobalClientToolMethods() {
        // Get global client tools
        const GlobalClientTools = require('@/lib/task-definitions/global-client-tools').GlobalClientTools;
        const globalClientTools = this.filterMethods(GlobalClientTools);
        return globalClientTools;
    }

    public getClientTool(toolName:string) {
        const tools = this.getDecoratedGlobalClientToolMethods();
        const tool = tools.find(tool => tool.metadata.name === toolName);
        return tool;
    }


}