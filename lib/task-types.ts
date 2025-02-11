import 'reflect-metadata';

interface ParameterMetadata {
  name: string;
  description: string;
  enum?: string[];
}

interface FunctionMetadata {
  name: string;
  description: string;
  parameters: ParameterMetadata[];
}

const functionRegistry: FunctionMetadata[] = [];

export function tool(description: string, params: ParameterMetadata[]) {
  return function (target: any, propertyKey: string) {
    const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);

    const parameters = params.map((param, index) => ({
      ...param,
      type: parameterTypes[index]?.name || 'unknown',
    }));

    const functionInfo: FunctionMetadata = {
      name: propertyKey,
      description,
      parameters,
    };

    functionRegistry.push(functionInfo);
  };
}