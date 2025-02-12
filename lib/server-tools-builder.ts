import 'reflect-metadata';
import { ToolAI, ToolPropertyAI } from '@/lib/tool-ai';

  
  
  


export class ServerToolsBuilder {


    public getDecoratedServerToolMethods() {
      const ServerTools = require('@/task-definitions/server-tools').ServerTools;
      const prototype = ServerTools.prototype;

      return Object.getOwnPropertyNames(prototype)
          .filter(method => method !== 'constructor') // Ignore constructor
          .filter(method => Reflect.hasMetadata('server-tool', prototype, method))
          .map(method => ({
              methodName: method,
              metadata: Reflect.getMetadata('server-tool', prototype, method)
          }));
    }

    public getDecoratedServerToolParameters() {
      const ServerTools = require('@/task-definitions/server-tools').ServerTools;
      const prototype = ServerTools.prototype;

      return Object.getOwnPropertyNames(prototype)
          .filter(method => method !== 'constructor')
          .filter(method => Reflect.hasMetadata('server-tool-parameters', prototype, method))
          .map(method => ({
              methodName: method,
              parameters: Reflect.getMetadata('server-tool-parameters', prototype, method)
      }));
    }



    public getServerToolList() {
        const tools = this.getDecoratedServerToolMethods();
        return tools.map(tool => ({
            id: tool.metadata.name,
            description: `${tool.metadata.name} - ${tool.metadata.description}`,
        }));
    }
    

    public getTools(taskServerTools:string[]): ToolAI[] {
      const tools = this.getDecoratedServerToolMethods();
      const toolParams = this.getDecoratedServerToolParameters();

      // Only include tools that are part of the task
      const filteredTools = tools.filter(tool => taskServerTools.includes(tool.metadata.name));
      console.log("taskServerTools", taskServerTools);

      return filteredTools.map(tool => {
          const params: { name: string; description: string; type: string }[] = 
            toolParams.find(tp => tp.methodName === tool.methodName)?.parameters || [];

          const properties: Record<string, ToolPropertyAI> = {};
          const requiredParams: string[] = [];

          params.forEach(param => {
              properties[param.name] = {
                  type: this.mapType(param.type),
                  description: param.description
              };
              requiredParams.push(param.name);
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


}
  