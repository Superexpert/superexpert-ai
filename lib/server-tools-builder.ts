import 'reflect-metadata';
import { ServerTools } from '@/task-definitions/server-tools';

const serverToolRegistry: { [key: string]: ServerToolMetaData } = {};

export interface ServerToolMetaData {
    name: string;
    description: string;
    parameters: ParameterMetadata[];
  }
  
  interface ParameterMetadata {
    name: string;
    description: string;
    type: string;
  }
  
  export function ServerTool(name: string, description: string) {
    return (target: Object, propertyKey: string, descriptor?: PropertyDescriptor) => {
      // Retrieve existing tool or create a new one
      let tool = serverToolRegistry[propertyKey] ?? { parameters: [] };
  
      // Update properties
      tool.name = name;
      tool.description = description;
  
      // Store back in the registry
      serverToolRegistry[propertyKey] = tool;
    };
  }
  
  
  export function ServerToolParameter(name:string, description:string) {
    return (target: Object, propertyKey:string, parameterIndex:number) => {
  
      const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
      const paramType = parameterTypes[parameterIndex];
  
      // Retrieve existing tool or create a new one
      let tool = serverToolRegistry[propertyKey] ?? { parameters: [] };
  
      // Update properties
      tool.parameters[parameterIndex] = {name, description, type: paramType.name};
  
      // Store back in the registry
      serverToolRegistry[propertyKey] = tool;
    }
  }
  
  


export class ServerToolsBuilder {

    constructor() {
        new ServerTools();
    }

    public getServerToolList() {
        const result = Object.values(serverToolRegistry).map((tool: ServerToolMetaData) => ({
            id: tool.name,
            description: `${tool.name} - ${tool.description}`,
        }));
        return result;
    }
    
    public getServerToolRegistry() {
        console.log("serverToolRegistry", serverToolRegistry);
        return serverToolRegistry;
    }


}
  