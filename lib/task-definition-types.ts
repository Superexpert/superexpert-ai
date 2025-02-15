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

}



export abstract class ClientToolsBase {
  
}


export class ServerDataRegistry {
  private static tools: { [key: string]: new (user: any, db: any) => ServerToolsBase } = {};

  static register(name: string, tool: new (user: any, db: any) => ServerToolsBase) {
      this.tools[name] = tool;
  }

  static createInstance(name: string, user: any, db: any): ServerToolsBase | null {
      if (!this.tools[name]) return null;
      return new this.tools[name](user, db);
  }

  static getAllInstances(user: any, db: any): ServerToolsBase[] {
      return Object.values(this.tools).map(ToolClass => new ToolClass(user, db));
  }
}

export class ServerToolsRegistry {
  private static tools: { [key: string]: new (user: any, db: any) => ServerToolsBase } = {};

  static register(name: string, tool: new (user: any, db: any) => ServerToolsBase) {
      this.tools[name] = tool;
  }

  static createInstance(name: string, user: any, db: any): ServerToolsBase | null {
      if (!this.tools[name]) return null;
      return new this.tools[name](user, db);
  }

  static getAllInstances(user: any, db: any): ServerToolsBase[] {
      return Object.values(this.tools).map(ToolClass => new ToolClass(user, db));
  }
}

export class ClientToolsRegistry {
  private static tools: { [key: string]: new (user: any, db: any) => ServerToolsBase } = {};

  static register(name: string, tool: new (user: any, db: any) => ServerToolsBase) {
      this.tools[name] = tool;
  }

  static createInstance(name: string, user: any, db: any): ServerToolsBase | null {
      if (!this.tools[name]) return null;
      return new this.tools[name](user, db);
  }

  static getAllInstances(user: any, db: any): ServerToolsBase[] {
      return Object.values(this.tools).map(ToolClass => new ToolClass(user, db));
  }
}