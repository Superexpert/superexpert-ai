export function ServerTool(name: string, description: string) {
  return (target: Object, propertyKey: string) => {
      Reflect.defineMetadata('server-tool', { name, description }, target, propertyKey);
  };
}


export function ServerToolParameter(name: string, description: string) {
  return (target: Object, propertyKey: string, parameterIndex: number) => {
      const existingParams: any[] = Reflect.getMetadata('server-tool-parameters', target, propertyKey) || [];
      
      const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
      const paramType = parameterTypes[parameterIndex];

      existingParams[parameterIndex] = {
          name,
          description,
          type: paramType?.name || 'unknown',
      };

      Reflect.defineMetadata('server-tool-parameters', existingParams, target, propertyKey);
  };
} 
