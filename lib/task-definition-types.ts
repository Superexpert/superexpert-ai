import { User } from '@/lib/user';
import { PrismaClient } from '@prisma/client';
import { ClientContext } from '@/lib/client/client-context';
import 'reflect-metadata';

interface ToolOptions {
    name: string;
    description: string;
}
/**
 * Decorator to define a tool for a method.
 * @param name - The name of the tool.
 * @param description - The description of the tool.
 * @returns A decorator function that adds metadata to the method.
 */
export function Tool(options: ToolOptions) {
    return (target: object, propertyKey: string) => {
        Reflect.defineMetadata(
            'tool',
            { name: options.name, description: options.description },
            target,
            propertyKey
        );
    };
}



interface ToolParameterOptions {
    name: string;
    description: string;
    enumValues?: (string | number)[];
}

export function ToolParameter(options: ToolParameterOptions) {
    return (target: object, propertyKey: string, parameterIndex: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingParams: any[] =
            Reflect.getMetadata('tool-parameters', target, propertyKey) || [];
        const parameterTypes = Reflect.getMetadata(
            'design:paramtypes',
            target,
            propertyKey
        );
        const paramType = parameterTypes?.[parameterIndex] || 'unknown';

        existingParams[parameterIndex] = {
            name: options.name,
            description: options.description,
            type: paramType.name || 'unknown',
            optional: false, // Mark as required
            enumValues: options.enumValues,
        };

        Reflect.defineMetadata(
            'tool-parameters',
            existingParams,
            target,
            propertyKey
        );
    };
}


export function OptionalToolParameter(name: string, description: string) {
    return (target: object, propertyKey: string, parameterIndex: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingParams: any[] =
            Reflect.getMetadata('tool-parameters', target, propertyKey) || [];
        const parameterTypes = Reflect.getMetadata(
            'design:paramtypes',
            target,
            propertyKey
        );
        const paramType = parameterTypes?.[parameterIndex] || 'unknown';

        existingParams[parameterIndex] = {
            name,
            description,
            type: paramType.name || 'unknown',
            optional: true, // Mark as optional
        };

        Reflect.defineMetadata(
            'tool-parameters',
            existingParams,
            target,
            propertyKey
        );
    };
}

export abstract class ServerDataBase {
    constructor(
        protected user: User,
        protected agent: {id:string, name: string},
        protected db: PrismaClient
    ) {}
}

export abstract class ServerToolsBase {
    constructor(
        protected user: User,
        protected agent: {id:string, name: string},
        protected db: PrismaClient
    ) {}
}

export abstract class ClientToolsBase {
    constructor(protected clientContext: ClientContext) {}
}
