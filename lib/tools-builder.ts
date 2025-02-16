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



    public getDecoratedServerDataMethods() {
       // Get custom server data
       const customServerData = require('@/task-definitions/server-data').CustomServerData;
       const customData = this.filterMethods(customServerData);

       console.log("yikes", customData);
 
       // Get system server data
       const systemServerData = require('@/lib/task-definitions/system-server-data').SystemServerData;
       const systemData = this.filterMethods(systemServerData);
 
       return [...customData, ...systemData];
    }


    public getDecoratedServerToolMethods() {
      // Get custom server tools
      const customServerTools = require('@/task-definitions/server-tools').CustomServerTools;
      const customTools = this.filterMethods(customServerTools);

      // Get system server tools
      const systemServerTools = require('@/lib/task-definitions/system-server-tools').SystemServerTools;
      const systemTools = this.filterMethods(systemServerTools);

      return [...customTools, ...systemTools];
      // const methods:any[] = [];
      // console.log("ServerToolsRegistry.getAllClasses()", ServerToolsRegistry.getAllClasses());
      // ServerToolsRegistry.getAllClasses().forEach((toolClass) => {
      //   console.log("toolClass", toolClass);
      //   const tools = this.filterMethods(toolClass);
      //   methods.push(...tools);
      // });
      // return methods;
    }

    // public getDecoratedGlobalServerToolMethods() {
    //   // Get global server tools
    //   const GlobalServerTools = require('@/lib/task-definitions/global-server-tools').GlobalServerTools;
    //   const globalServerTools = this.filterMethods(GlobalServerTools);
    //   return globalServerTools;
    // }


    public getDecoratedClientToolMethods() {
      // Get custom client tools
      const customClientTools = require('@/task-definitions/client-tools').CustomClientTools;
      const customTools = this.filterMethods(customClientTools);

      // Get global client tools
      const systemClientTools = require('@/lib/task-definitions/system-client-tools').SystemClientTools;
      const systemTools = this.filterMethods(systemClientTools);

      return [...customTools, ...systemTools];
    }

    // public getDecoratedGlobalClientToolMethods() {
    //   // Get global client tools
    //   const GlobalClientTools = require('@/lib/task-definitions/global-client-tools').GlobalClientTools;
    //   const globalClientTools = this.filterMethods(GlobalClientTools);
    //   return globalClientTools;
    // }

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

    // public getDecoratedServerToolParameters() {
    //   const params:any[] = [];
    //   ServerToolsRegistry.getAllClasses().forEach((toolClass) => {
    //     console.log("toolClass", toolClass);
    //     const tools = this.filterParameters(toolClass);
    //     params.push(...tools);
    //   });
    //   return params;
    // }

    public getDecoratedServerToolParameters() {
      const customServerTools = require('@/task-definitions/server-tools').CustomServerTools;
      const customParams = this.filterParameters(customServerTools);

      const systemServerTools = require('@/lib/task-definitions/system-server-tools').SystemServerTools;
      const systemParams = this.filterParameters(systemServerTools);
      return[...customParams, ...systemParams];
    }


    public getDecoratedClientToolParameters() {
      const customClientTools = require('@/task-definitions/client-tools').CustomClientTools;
      const customParams = this.filterParameters(customClientTools);

      const systemClientTools = require('@/lib/task-definitions/system-server-tools').SystemClientTools;
      const systemParams = this.filterParameters(systemClientTools);
      return[...customParams, ...systemParams];
    }

    // public getDecoratedGlobalClientToolParameters() {
    //   const ClientTools = require('@/lib/task-definitions/global-client-tools').GlobalClientTools;
    //   const clientParams = this.filterParameters(ClientTools);
    //   return clientParams;
    // }

    public getServerDataList() {
      const tools = this.getDecoratedServerDataMethods();
      return tools.map(tool => ({
          id: tool.metadata.name,
          description: `${tool.metadata.name} - ${tool.metadata.description}`,
      }));
    }


    public getServerToolList() {
        const tools = this.getDecoratedServerToolMethods();
        return tools.map(tool => ({
            id: tool.metadata.name,
            description: `${tool.metadata.name} - ${tool.metadata.description}`,
        }));
    }

    public getClientToolList() {
      const tools = this.getDecoratedClientToolMethods();
      return tools.map(tool => ({
          id: tool.metadata.name,
          description: `${tool.metadata.name} - ${tool.metadata.description}`,
      }));
    }


    public getTools(toolIds:string[]): ToolAI[] {
      const allTools = [
        ...this.getDecoratedServerToolMethods(),
        ...this.getDecoratedClientToolMethods(),
      ];

      const allToolParams = [
        ...this.getDecoratedServerToolParameters(),
        ...this.getDecoratedClientToolParameters(),
      ];

      console.log("IN Get Tools", toolIds);
      console.log("all tools", allTools);

      // console.log("global params");
      // console.dir(this.getDecoratedGlobalClientToolParameters(), {depth: null});

      // Only include tools that correspond to the current task or global task
      const filteredTools = allTools.filter(tool => toolIds.includes(tool.metadata.name));
      //console.log("taskTools", filteredCustomTools);

      

      return filteredTools.map(tool => {
          const params: { name: string; description: string; type: string; optional?:boolean }[] = 
            allToolParams.find(tp => tp.methodName === tool.methodName)?.parameters || [];

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

      const tools = this.getDecoratedServerToolMethods();
      const tool = tools.find(tool => tool.metadata.name === toolName);
      if (!tool) {
          throw new Error(`Tool ${toolName} not found`);
      }

      const method = prototype[tool.methodName];
      const params: any[] = Object.values(toolParams);
      return await method.apply(prototype, params);
    }

}

