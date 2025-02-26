import { AIModel } from '@/lib/models/ai-model';
import { OpenAIModel } from '@/lib/models/openai-model';
import { GoogleAIModel } from '@/lib/models/google-model';
import { AnthropicAIModel } from '@/lib/models/anthropic-model';

export class AIModelFactory {
    // Define available models with human-readable names
    // https://platform.openai.com/docs/models
    // https://docs.anthropic.com/en/docs/about-claude/models/all-models#model-comparison-table
    // https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models
    private static modelMap: Record<string, { provider: string; model: string, description: string }> = {
        'OpenAI: GPT-4o': {
            provider: 'openai',
            model: 'gpt-4o',
            description: 'Fast, intelligent, flexible GPT model',
        },
        'OpenAI: GPT-4o mini': {
          provider: 'openai',
          model: 'gpt-4o-mini',
          description: 'Fastest responses, cost-effective, customizable',
        },
        'OpenAI: o1': { 
          provider: 'openai', 
          model: 'o1', 
          description: 'High intelligence reasoning model'
        },
        'OpenAI: o3 mini': { 
          provider: 'openai', 
          model: 'o3-mini',
          description: 'Fast, flexible reasoning model' 
        },
        'Anthropic: Claude 3.7 Sonnet': {
          provider: 'anthropic',
          model: 'claude-3-7-sonnet-20250219',
          description: 'Our most intelligent model'
        },
        'Anthropic: Claude 3.5 Sonnet': {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          description: 'Our previous most intelligent model'
        },
        'Anthropic: Claude 3.5 Haiku': {
          provider: 'anthropic',
          model: 'claude-3-5-haiku-20241022',
          description: 'Our fastest model'
        },
        'Anthropic: Claude 3 Opus': {
          provider: 'anthropic',
          model: 'claude-3-opus-20240229',
          description: 'Powerful model for complex tasks'
        },
        'Anthropic: Claude 3 Haiku': {
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307',
          description: 'Fastest and most compact model for near-instant responsiveness'
        },
        'Google: Gemini 2.0 Flash': {
          provider: 'google',
          model: 'gemini-2.0-flash',
          description: 'Workhorse model for all daily tasks. Strong overall performance and supports real-time streaming Live API'
        },
        'Google: Gemini 2.0 Pro': {
          provider: 'google',
          model: 'gemini-2.0-pro-exp-02-05',
          description: 'Strongest model quality, especially for code & world knowledge; 2M long context'
        },
        'Google: Gemini 2.0 Flash-Lite': {
          provider: 'google',
          model: 'gemini-2.0-flash-lite',
          description: 'Our cost effective offering to support high throughput'
        },
        'Google: Gemini 2.0 Flash Thinking': {
          provider: 'google',
          model: 'gemini-2.0-flash-thinking-exp-01-21',
          description: 'Provides stronger reasoning capabilities and includes the thinking process in responses'
        },
    };

    /** Get a list of available models with their details */
    static getAvailableModels(): { id: string; name: string; description: string }[] {
      return Object.entries(this.modelMap).map(([key, value]) => ({
          name: key, // Human-readable model name (e.g., "OpenAI: GPT-4o")
          id: value.model, // Model identifier (e.g., "gpt-4o")
          description: value.description, // Model description
      }));
    }

    /** Create an AI model instance based on the selected name */
    static createModel(selectedModel: string): AIModel {
        const modelInfo = this.modelMap[selectedModel];

        if (!modelInfo) {
            throw new Error(`Unsupported AI model: ${selectedModel}`);
        }

        switch (modelInfo.provider) {
            case 'openai':
                return new OpenAIModel(modelInfo.model);
            case 'google':
                return new GoogleAIModel(modelInfo.model);
            case 'anthropic':
                return new AnthropicAIModel(modelInfo.model);
            default:
                throw new Error(`Unknown provider: ${modelInfo.provider}`);
        }
    }
}

// import { AIModel } from '@/lib/models/ai-model';
// import { GPT4oModel } from '@/lib/models/gpt4o';
// import { GoogleAIModel } from './google-ai-model';
// import { AnthropicAIModel } from './anthropic-ai-model';

// export class AIModelFactory {
//   static createModel(provider: string): AIModel {
//     switch (provider.toLowerCase()) {
//       case "gpt-4o":
//         return new GPT4oModel();
//       case "gemini":
//         return new GoogleAIModel();
//       case "anthropic":
//         return new AnthropicAIModel();
//       default:
//         throw new Error("Unsupported AI model provider");
//     }
//   }
// }
