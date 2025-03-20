import { LLMModelDefinition } from '@/lib/adapters/llm-adapters/llm-model-definition';
import { LLMModelConfiguration } from './adapters/llm-adapters/llm-model-configuration';
import { LLMAdapter } from '@/lib/adapters/llm-adapters/llm-adapter';
import {
    ServerDataBase,
    ServerToolsBase,
    ClientToolsBase,
} from '@/lib/task-definition-types';
import { User } from '@/lib/user';
import { PrismaClient } from '@prisma/client';
import { ClientContext } from '@/lib/client/client-context';

// Create a class-based singleton registry to ensure proper initialization and sharing
class Registry {
    private static instance: Registry;
    public llms: Record<string, LLMPlugin> = {};
    public serverDataTools: ServerDataToolsConstructor[] = [];
    public serverTools: ServerToolsConstructor[] = [];
    public clientTools: ClientToolsConstructor[] = [];

    private constructor() {}

    public static getInstance(): Registry {
        if (!Registry.instance) {
            Registry.instance = new Registry();
        }
        return Registry.instance;
    }
}

// Get the singleton registry
const getRegistry = () => {
    // Use global for server-side persistence
    if (typeof window === 'undefined') {
        if (!global._registry) {
            global._registry = Registry.getInstance();
        }
        return global._registry;
    }

    // Use module-level singleton for client-side
    return Registry.getInstance();
};

// Add this to the global type
declare global {
    // eslint-disable-next-line no-var
    var _registry: Registry | undefined;
}

// Export a consistent registry reference
const registry = getRegistry();

type ServerDataToolsConstructor = new (
    user: User,
    agent: { id: string; name: string },
    db: PrismaClient
) => ServerDataBase;

type ServerToolsConstructor = new (
    user: User,
    agent: { id: string; name: string },
    db: PrismaClient
) => ServerToolsBase;

type ClientToolsConstructor = new (
    clientContext: ClientContext
) => ClientToolsBase;

export interface LLMPlugin {
    definition: LLMModelDefinition;
    adapter: new (
        modelId: string,
        modelConfiguration?: LLMModelConfiguration
    ) => LLMAdapter;
}

export function registerLLM(plugin: LLMPlugin) {
    if (registry.llms[plugin.definition.id]) {
        return;
    }
    registry.llms[plugin.definition.id] = plugin;
}

export function registerServerDataTool(plugin: ServerDataToolsConstructor) {
   // Get constructor name
   const pluginName = plugin.name;
    
   // Check if a tool with the same name is already registered
   const exists = registry.clientTools.some(tool => tool.name === pluginName);
   if (!exists) {
       registry.serverDataTools.push(plugin);
   }
}

export function registerServerTool(plugin: ServerToolsConstructor) {
   // Get constructor name
   const pluginName = plugin.name;
    
   // Check if a tool with the same name is already registered
   const exists = registry.clientTools.some(tool => tool.name === pluginName);
   if (!exists) {
       registry.serverTools.push(plugin);
   }
}


export function registerClientTool(plugin: ClientToolsConstructor) {
   // Get constructor name
   const pluginName = plugin.name;
    
   // Check if a tool with the same name is already registered
   const exists = registry.clientTools.some(tool => tool.name === pluginName);
   if (!exists) {
       registry.clientTools.push(plugin);
   }
}

export function getLLMPlugin(modelId: string): LLMPlugin | undefined {
    return registry.llms[modelId];
}

export function getLLMModels(): LLMModelDefinition[] {
    return Object.values(registry.llms).map((plugin) => plugin.definition);
}

export function getLLMModel(id: string): LLMModelDefinition | undefined {
    return registry.llms[id].definition;
}

export function getClientTools(): ClientToolsConstructor[] {
    return registry.clientTools;
}

export function getServerDataTools(): ServerDataToolsConstructor[] {
    return registry.serverDataTools;
}

export function getServerTools(): ServerToolsConstructor[] {
    return registry.serverTools;
}
