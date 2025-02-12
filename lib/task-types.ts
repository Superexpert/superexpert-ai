export function Tool(name: string, description: string) {
  return (target: Object, propertyKey: string) => {
      Reflect.defineMetadata('tool', { name, description }, target, propertyKey);
  };
}


export function ToolParameter(name: string, description: string) {
  return (target: Object, propertyKey: string, parameterIndex: number) => {
      const existingParams: any[] = Reflect.getMetadata('tool-parameters', target, propertyKey) || [];
      
      const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
      const paramType = parameterTypes[parameterIndex];

      existingParams[parameterIndex] = {
          name,
          description,
          type: paramType?.name || 'unknown',
      };

      Reflect.defineMetadata('tool-parameters', existingParams, target, propertyKey);
  };
} 
