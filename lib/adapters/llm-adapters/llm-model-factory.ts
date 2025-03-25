
import { getLLM, LLMModelConfiguration, LLMAdapter } from '@superexpert-ai/framework';

export class LLMModelFactory {
  /** Create an AI model instance based on the selected id */
  static createModel(modelId: string, modelConfiguration?: LLMModelConfiguration): LLMAdapter {
    const plugin = getLLM(modelId);
    if (!plugin) {
      throw new Error(`Unsupported AI model ID: ${modelId}`);
    }
    // Pass the model ID from the plugin's definition along with the config.
    return new plugin.adapter(plugin.definition.id, modelConfiguration);
  }
}

 




// import { LLMAdapter } from '@/lib/adapters/llm-adapters/llm-adapter';
// import { OpenAILLMAdapter } from '@/lib/adapters/llm-adapters/openai-llm-adapter';
// import { GoogleLLMAdapter } from '@/lib/adapters/llm-adapters/google-llm-adapter';
// import { AnthropicLLMAdapter } from '@/lib/adapters/llm-adapters/anthropic-llm-adapter';
// import { ModelDefinition } from '@/lib/adapters/llm-adapters/llm-model-definition';
// import { ModelConfiguration } from '@/lib/adapters/llm-adapters/llm-model-configuration';

// export class LLMModelFactory {
//     // Define available models with human-readable names
//     // https://platform.openai.com/docs/models
//     // https://docs.anthropic.com/en/docs/about-claude/models/all-models#model-comparison-table
//     // https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models
    // private static models: ModelDefinition[] = [
    //     {
    //       name:'OpenAI: GPT-4.5 Preview',
    //       provider: 'openai',
    //       id: 'gpt-4.5-preview',
    //       description: 'Largest GPT model, good for creative tasks and agentic planning',
    //       maximumOutputTokens: 16384,
    //       maximumTemperature: 2,
    //     },
    //     {
    //       name:  'OpenAI: GPT-4o',
    //         provider: 'openai',
    //         id: 'gpt-4o',
    //         description: 'Fast, intelligent, flexible GPT model',
    //         maximumOutputTokens: 16384,
    //         maximumTemperature: 2,  
    //     },
    //     {
    //       name: 'OpenAI: GPT-4o mini',
    //       provider: 'openai',
    //       id: 'gpt-4o-mini',
    //       description: 'Fastest responses, cost-effective, customizable',
    //       maximumOutputTokens: 16384,
    //       maximumTemperature: 2,
    //     },

    //     // Not yet available to all users
    //     // 'OpenAI: o1': { 
    //     //   provider: 'openai', 
    //     //   model: 'o1', 
    //     //   description: 'High intelligence reasoning model'
    //     // },

    //     {
    //       name: 'Anthropic: Claude 3.7 Sonnet',
    //       provider: 'anthropic',
    //       id: 'claude-3-7-sonnet-20250219',
    //       description: 'Our most intelligent model',
    //       maximumOutputTokens: 8192,
    //       maximumTemperature: 1.0,
    //     },
    //     {
    //       name: 'Anthropic: Claude 3.5 Sonnet',
    //       provider: 'anthropic',
    //       id: 'claude-3-5-sonnet-20241022',
    //       description: 'Our previous most intelligent model',
    //       maximumOutputTokens: 8192,
    //       maximumTemperature: 1.0,
    //     },
    //     {
    //       name: 'Anthropic: Claude 3.5 Haiku',
    //       provider: 'anthropic',
    //       id: 'claude-3-5-haiku-20241022',
    //       description: 'Our fastest model',
    //       maximumOutputTokens: 8192,
    //       maximumTemperature: 1.0,
    //     },
    //     {
    //       name: 'Anthropic: Claude 3 Opus',
    //       provider: 'anthropic',
    //       id: 'claude-3-opus-20240229',
    //       description: 'Powerful model for complex tasks',
    //       maximumOutputTokens: 4096,
    //       maximumTemperature: 1.0,
    //     },
    //     {
    //       name:'Anthropic: Claude 3 Haiku',
    //       provider: 'anthropic',
    //       id: 'claude-3-haiku-20240307',
    //       description: 'Fastest and most compact model for near-instant responsiveness',
    //       maximumOutputTokens: 4096,
    //       maximumTemperature: 1.0,
    //     },
    //     {
    //       name: 'Google: Gemini 2.0 Flash',
    //       provider: 'google',
    //       id: 'gemini-2.0-flash',
    //       description: 'Workhorse model for all daily tasks. Strong overall performance and supports real-time streaming Live API',
    //       maximumOutputTokens: 8192,
    //       maximumTemperature: 2.0,
    //     },
    //     {
    //       name: 'Google: Gemini 2.0 Pro',
    //       provider: 'google',
    //       id: 'gemini-2.0-pro-exp-02-05',
    //       description: 'Strongest model quality, especially for code & world knowledge; 2M long context',
    //       maximumOutputTokens: 8192,
    //       maximumTemperature: 2.0,
    //     },
    //     {
    //       name: 'Google: Gemini 2.0 Flash-Lite',
    //       provider: 'google',
    //       id: 'gemini-2.0-flash-lite',
    //       description: 'Our cost effective offering to support high throughput',
    //       maximumOutputTokens: 8192,
    //       maximumTemperature: 2.0,
    //     },
    //     // Does not support custom functions, "Function calling is not enabled for models"
    //     // 'Google: Gemini 2.0 Flash Thinking': {
    //     //   provider: 'google',
    //     //   model: 'gemini-2.0-flash-thinking-exp-01-21',
    //     //   description: 'Provides stronger reasoning capabilities and includes the thinking process in responses'
    //     // },
    //   ];

//     /** Get a list of available models with their details */
//     static getAvailableModels() {
//       return this.models;
//     }

//     static getModelById(modelId: string) {
//       return this.models.find((entry) => entry.id === modelId);
//     }

//     /** Create an AI model instance based on the selected id */
//     static createModel(modelId: string, modelConfiguration?: ModelConfiguration): LLMAdapter {
//       const modelEntry = this.getModelById(modelId);
//       if (!modelEntry) {
//           throw new Error(`Unsupported AI model ID: ${modelId}`);
//       }

//       switch (modelEntry.provider) {
//           case 'openai':
//               return new OpenAILLMAdapter(modelEntry.id, modelConfiguration);
//           case 'google':
//               return new GoogleLLMAdapter(modelEntry.id, modelConfiguration);
//           case 'anthropic':
//               return new AnthropicLLMAdapter(modelEntry.id,  modelConfiguration);
//           default:
//               throw new Error(`Unknown provider: ${modelEntry.provider}`);
//       }
//   }
// }


