import 'reflect-metadata';
import { ToolAI, ToolPropertyAI } from '@/lib/tool-ai';

export class ToolsBuilder {

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


    public getDecoratedCustomServerToolMethods() {
      // Get custom server tools
      const ServerTools = require('@/task-definitions/server-tools').ServerTools;
      const customServerTools = this.filterMethods(ServerTools);
      return customServerTools;
    }

    public getDecoratedGlobalServerToolMethods() {
      // Get global server tools
      const GlobalServerTools = require('@/lib/task-definitions/global-server-tools').GlobalServerTools;
      const globalServerTools = this.filterMethods(GlobalServerTools);
      return globalServerTools;
    }


    public getDecoratedCustomClientToolMethods() {
      // Get custom client tools
      const ClientTools = require('@/task-definitions/client-tools').ClientTools;
      const customClientTools = this.filterMethods(ClientTools);
      return customClientTools;
    }

    public getDecoratedGlobalClientToolMethods() {
      // Get global client tools
      const GlobalClientTools = require('@/lib/task-definitions/global-client-tools').GlobalClientTools;
      const globalClientTools = this.filterMethods(GlobalClientTools);
      return globalClientTools;
    }

    private filterParameters(targetClass: any) {
      const prototype = targetClass?.prototype;
      if (!prototype) {
          return [];
      }
      return Object.getOwnPropertyNames(prototype)
          .filter(method => method !== 'constructor')
          .filter(method => Reflect.hasMetadata('tool-parameters', prototype, method))
          .map(method => ({
              methodName: method,
              parameters: Reflect.getMetadata('tool-parameters', prototype, method)
      }));
    }

    public getDecoratedCustomServerToolParameters() {
      const ServerTools = require('@/task-definitions/server-tools').ServerTools;
      const serverParams = this.filterParameters(ServerTools);
      return serverParams;
    }

    public getDecoratedGlobalServerToolParameters() {
      const ServerTools = require('@/lib/task-definitions/global-server-tools').GlobalServerTools;
      const serverParams = this.filterParameters(ServerTools);
      return serverParams;
    }


    public getDecoratedCustomClientToolParameters() {
      const ClientTools = require('@/task-definitions/client-tools').ClientTools;
      const clientParams = this.filterParameters(ClientTools);
      return clientParams;
    }

    public getDecoratedGlobalClientToolParameters() {
      const ClientTools = require('@/lib/task-definitions/global-client-tools').GlobalClientTools;
      const clientParams = this.filterParameters(ClientTools);
      return clientParams;
    }

    public getCustomServerToolList() {
        const tools = this.getDecoratedCustomServerToolMethods();
        return tools.map(tool => ({
            id: tool.metadata.name,
            description: `${tool.metadata.name} - ${tool.metadata.description}`,
        }));
    }
    

    public getTools(taskTools:string[]): ToolAI[] {
      const customTools = [
        ...this.getDecoratedCustomServerToolMethods(),
        ...this.getDecoratedCustomClientToolMethods(),
      ];
      const globalTools = [
        ...this.getDecoratedGlobalServerToolMethods(),
        ...this.getDecoratedGlobalClientToolMethods(),
      ];
      const toolParams = [
        ...this.getDecoratedGlobalServerToolParameters(),
        ...this.getDecoratedGlobalClientToolParameters(),
        ...this.getDecoratedCustomServerToolParameters(),
        ...this.getDecoratedCustomClientToolParameters(),
      ];

      // console.log("global params");
      // console.dir(this.getDecoratedGlobalClientToolParameters(), {depth: null});

      // Only include tools that are part of the task
      const filteredCustomTools = customTools.filter(tool => taskTools.includes(tool.metadata.name));
      //console.log("taskTools", filteredCustomTools);

      // Combine global and custom tools
      const tools = [
        ...filteredCustomTools,
        ...globalTools
      ];

      return tools.map(tool => {
          const params: { name: string; description: string; type: string; optional?:boolean }[] = 
            toolParams.find(tp => tp.methodName === tool.methodName)?.parameters || [];

          const properties: Record<string, ToolPropertyAI> = {};
          const requiredParams: string[] = [];

          params.forEach(param => {
              properties[param.name] = {
                  type: this.mapType(param.type),
                  description: param.description
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
                      required: requiredParams.length > 0 ? requiredParams : undefined
                  }
              }
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

    public async callServerTool(toolName:string, toolParams:Record<string, any>) {
      const ServerTools = require('@/task-definitions/server-tools').ServerTools;
      const prototype = ServerTools.prototype;

      const tools = [
        ...this.getDecoratedCustomServerToolMethods(),
        ...this.getDecoratedGlobalServerToolMethods()
      ];
      const tool = tools.find(tool => tool.metadata.name === toolName);
      if (!tool) {
          throw new Error(`Tool ${toolName} not found`);
      }

      const method = prototype[tool.methodName];
      const params: any[] = Object.values(toolParams);
      return await method.apply(prototype, params);
    }

}

