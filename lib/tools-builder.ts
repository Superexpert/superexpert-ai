import 'reflect-metadata';
import { ToolAI, ToolPropertyAI } from '@/lib/tool-ai';
import plugins from '@/superexpert-plugins'; 


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
      const methods:any[] = [];
      plugins.ServerData.forEach((plugin) => {
        const tools = this.filterMethods(plugin);
        methods.push(...tools);
      });
      return methods;
    }


    public getDecoratedServerToolMethods() {
      const methods:any[] = [];
      plugins.ServerTools.forEach((plugin) => {
        const tools = this.filterMethods(plugin);
        methods.push(...tools);
      });
      return methods;
    }

    public getDecoratedClientToolMethods() {
      const methods:any[] = [];
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
          .filter(method => method !== 'constructor')
          .filter(method => Reflect.hasMetadata('tool-parameters', prototype, method))
          .map(method => ({
              methodName: method,
              parameters: Reflect.getMetadata('tool-parameters', prototype, method)
      }));
    }



    public getDecoratedServerToolParameters() {
      const params:any[] = [];
      plugins.ServerTools.forEach((plugin) => {
        const pluginParams = this.filterParameters(plugin);
        params.push(...pluginParams);
      });
      return params;

      // const customServerTools = require('@/task-definitions/server-tools').CustomServerTools;
      // const customParams = this.filterParameters(customServerTools);

      // const systemServerTools = require('@/lib/task-definitions/system-server-tools').SystemServerTools;
      // const systemParams = this.filterParameters(systemServerTools);
      // return[...customParams, ...systemParams];
    }


    public getDecoratedClientToolParameters() {
      const params:any[] = [];
      plugins.ClientTools.forEach((plugin) => {
        const pluginParams = this.filterParameters(plugin);
        params.push(...pluginParams);
      });
      return params;
    }

 

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


      // Only include tools that correspond to the current task or global task
      const filteredTools = allTools.filter(tool => toolIds.includes(tool.metadata.name));
      

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

    public async callServerTool(toolName: string, toolParams: Record<string, any>) {
      const serverTools = plugins.ServerTools;
  
      for (const ToolClass of serverTools) {
        const toolInstance = new ToolClass();
  
        // Iterate through the methods of the class
        const methodNames = Object.getOwnPropertyNames(ToolClass.prototype)
          .filter(method => method !== 'constructor');
  
        for (const methodName of methodNames) {
          const metadata = Reflect.getMetadata('tool', ToolClass.prototype, methodName);
  
          if (metadata && metadata.name === toolName) {
            // Get method reference
            const method = (toolInstance as any)[methodName];
  
            if (typeof method === 'function') {
              // // Get method parameters from metadata
              // const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', ToolClass.prototype, methodName) || [];
              // const paramNames = this.getParameterNames(method);
  
              // // Validate required parameters
              // const args = paramNames.map((paramName, index) => {
              //   if (!(paramName in toolParams)) {
              //     throw new Error(`Missing required parameter: ${paramName}`);
              //   }
              //   return this.castParameter(paramTypes[index], toolParams[paramName]);
              // });
  
              // Call the tool method with arguments
              const args = Object.values(toolParams);
              return await method.apply(toolInstance, args);
            }
          }
        }
      }
  
      throw new Error(`Tool '${toolName}' not found.`);
    }


    // public async callServerTool(toolName:string, toolParams:Record<string, any>) {
    //   const tools = this.getDecoratedServerToolMethods();
    //   const tool = tools.find(tool => tool.metadata.name === toolName);
    //   if (!tool) {
    //       throw new Error(`Tool ${toolName} not found`);
    //   }

    //   console.log("Executing tool:", tool);
    //   console.dir(tool, {depth: 5});

    //   const method = tool.methodName;
    //   const params: any[] = Object.values(toolParams);
    //   return await method.apply(tool, params);

    //   // const ServerTools = require('@/task-definitions/server-tools').ServerTools;
    //   // const prototype = ServerTools.prototype;

    //   // const tools = await this.getDecoratedServerToolMethods();
    //   // const tool = tools.find(tool => tool.metadata.name === toolName);
    //   // if (!tool) {
    //   //     throw new Error(`Tool ${toolName} not found`);
    //   // }

    //   // const method = prototype[tool.methodName];
    //   // const params: any[] = Object.values(toolParams);
    //   // return await method.apply(prototype, params);
    // }

}

