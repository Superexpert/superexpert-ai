import 'reflect-metadata';

const serverToolRegistry: { [key: string]: ServerToolMetaData } = {};

export function getServerToolList() {
  const result = Object.values(serverToolRegistry).map((tool: ServerToolMetaData) => ({
    id: tool.name,
    description: `${tool.name} - ${tool.description}`,
  }));
  return result;
}

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



// interface ParameterMetadata {
//   name: string;
//   description: string;
//   enum?: string[];
// }

// interface FunctionMetadata {
//   name: string;
//   description: string;
//   parameters: ParameterMetadata[];
// }

// const functionRegistry: FunctionMetadata[] = [];

// export function tool(description: string, params: ParameterMetadata[]) {
//   return function (target: any, propertyKey: string) {
//     const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);

//     const parameters = params.map((param, index) => ({
//       ...param,
//       type: parameterTypes[index]?.name || 'unknown',
//     }));

//     const functionInfo: FunctionMetadata = {
//       name: propertyKey,
//       description,
//       parameters,
//     };

//     functionRegistry.push(functionInfo);
//   };
// }