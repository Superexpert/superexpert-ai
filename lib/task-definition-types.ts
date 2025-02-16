export function ServerData(name: string, description: string) {
  return (target: Object, propertyKey: string) => {
      Reflect.defineMetadata('serverData', { name, description }, target, propertyKey);
  };
}


export function Tool(name: string, description: string) {
  return (target: Object, propertyKey: string) => {
      Reflect.defineMetadata('tool', { name, description }, target, propertyKey);
  };
}



export function ToolParameter(name: string, description: string) {
  return (target: Object, propertyKey: string, parameterIndex: number) => {
    const existingParams: any[] = Reflect.getMetadata('tool-parameters', target, propertyKey) || [];
    const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
    const paramType = parameterTypes?.[parameterIndex] || 'unknown';

    existingParams[parameterIndex] = {
      name,
      description,
      type: paramType.name || 'unknown',
      optional: false,  // Mark as required
    };

    Reflect.defineMetadata('tool-parameters', existingParams, target, propertyKey);
  };
}

export function OptionalToolParameter(name: string, description: string) {
  return (target: Object, propertyKey: string, parameterIndex: number) => {
    const existingParams: any[] = Reflect.getMetadata('tool-parameters', target, propertyKey) || [];
    const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
    const paramType = parameterTypes?.[parameterIndex] || 'unknown';

    existingParams[parameterIndex] = {
      name,
      description,
      type: paramType.name || 'unknown',
      optional: true,  // Mark as optional
    };

    Reflect.defineMetadata('tool-parameters', existingParams, target, propertyKey);
  };
}


export abstract class ServerDataBase {

}


export abstract class ServerToolsBase {
  constructor() {
    console.log("ServerToolsBase constructor");
    ServerToolsRegistry.register(this.constructor.name, this);
  }
}



export abstract class ClientToolsBase {
  
}


export class ServerDataRegistry {
  private static tools: { [key: string]: ServerDataBase } = {};

  static register(name: string, tool: ServerDataBase) {
      this.tools[name] = tool;
  }

  static getAllClasses():ServerDataBase[] {
      return Object.values(this.tools);
  }

}


export class ServerToolsRegistry {
  private static tools: { [key: string]: ServerToolsBase } = {};

  static register(name: string, tool: ServerToolsBase) {
    console.log("Registering tool", name, tool);
      this.tools[name] = tool;
  }

  static getAllClasses():ServerToolsBase[] {
      return Object.values(this.tools);
  }

}

export class ClientToolsRegistry {
  private static tools: { [key: string]: ClientToolsBase } = {};

  static register(name: string, tool: ClientToolsBase) {
      this.tools[name] = tool;
  }

  static getAllClasses():ClientToolsBase[] {
      return Object.values(this.tools);
  }

}

export function AutoRegisterTool(name?: string) {
  return function (constructor: any) {
    console.log("potatos are hard to speell");
  };
}
