import { registerLLM } from '@/lib/plugin-registry';
import { OpenAILLMAdapter } from '@/lib/adapters/llm-adapters/openai-llm-adapter';
import { GoogleLLMAdapter } from '@/lib/adapters/llm-adapters/google-llm-adapter';
import { AnthropicLLMAdapter } from '@/lib/adapters/llm-adapters/anthropic-llm-adapter';

// Register OpenAI: GPT-4.5 Preview
registerLLM({
    definition: {
        id: 'gpt-4.5-preview',
        name: 'OpenAI: GPT-4.5 Preview',
        provider: 'openai',
        description:
            'Largest GPT model, good for creative tasks and agentic planning',
        maximumOutputTokens: 16384,
        maximumTemperature: 2,
    },
    adapter: OpenAILLMAdapter,
});

// Register OpenAI: GPT-4o
registerLLM({
    definition: {
        id: 'gpt-4o',
        name: 'OpenAI: GPT-4o',
        provider: 'openai',
        description: 'Fast, intelligent, flexible GPT model',
        maximumOutputTokens: 16384,
        maximumTemperature: 2,
    },
    adapter: OpenAILLMAdapter,
});

// Register OpenAI: GPT-4o mini
registerLLM({
    definition: {
        name: 'OpenAI: GPT-4o mini',
        provider: 'openai',
        id: 'gpt-4o-mini',
        description: 'Fastest responses, cost-effective, customizable',
        maximumOutputTokens: 16384,
        maximumTemperature: 2,
    },
    adapter: OpenAILLMAdapter,
});

// Not yet available to all users
// registerLLM({
//   definition: {
//     name: 'OpenAI: o1',
//     provider: 'openai',
//     id: 'o1',
//     description: 'High intelligence reasoning model',
//     // Add additional properties as needed
//   },
//   adapter: OpenAILLMAdapter,
// });

// Register Anthropic: Claude 3.7 Sonnet
registerLLM({
    definition: {
        name: 'Anthropic: Claude 3.7 Sonnet',
        provider: 'anthropic',
        id: 'claude-3-7-sonnet-20250219',
        description: 'Our most intelligent model',
        maximumOutputTokens: 8192,
        maximumTemperature: 1.0,
    },
    adapter: AnthropicLLMAdapter,
});

// Register Anthropic: Claude 3.5 Sonnet
registerLLM({
    definition: {
        name: 'Anthropic: Claude 3.5 Sonnet',
        provider: 'anthropic',
        id: 'claude-3-5-sonnet-20241022',
        description: 'Our previous most intelligent model',
        maximumOutputTokens: 8192,
        maximumTemperature: 1.0,
    },
    adapter: AnthropicLLMAdapter,
});

// Register Anthropic: Claude 3.5 Haiku
registerLLM({
    definition: {
        name: 'Anthropic: Claude 3.5 Haiku',
        provider: 'anthropic',
        id: 'claude-3-5-haiku-20241022',
        description: 'Our fastest model',
        maximumOutputTokens: 8192,
        maximumTemperature: 1.0,
    },
    adapter: AnthropicLLMAdapter,
});

// Register Anthropic: Claude 3 Opus
registerLLM({
    definition: {
        name: 'Anthropic: Claude 3 Opus',
        provider: 'anthropic',
        id: 'claude-3-opus-20240229',
        description: 'Powerful model for complex tasks',
        maximumOutputTokens: 4096,
        maximumTemperature: 1.0,
    },
    adapter: AnthropicLLMAdapter,
});

// Register Anthropic: Claude 3 Haiku
registerLLM({
    definition: {
        name: 'Anthropic: Claude 3 Haiku',
        provider: 'anthropic',
        id: 'claude-3-haiku-20240307',
        description:
            'Fastest and most compact model for near-instant responsiveness',
        maximumOutputTokens: 4096,
        maximumTemperature: 1.0,
    },
    adapter: AnthropicLLMAdapter,
});

// Register Google: Gemini 2.0 Flash
registerLLM({
    definition: {
        name: 'Google: Gemini 2.0 Flash',
        provider: 'google',
        id: 'gemini-2.0-flash',
        description:
            'Workhorse model for all daily tasks. Strong overall performance and supports real-time streaming Live API',
        maximumOutputTokens: 8192,
        maximumTemperature: 2.0,
    },
    adapter: GoogleLLMAdapter,
});

// Register Google: Gemini 2.0 Pro
registerLLM({
    definition: {
        name: 'Google: Gemini 2.0 Pro',
        provider: 'google',
        id: 'gemini-2.0-pro-exp-02-05',
        description:
            'Strongest model quality, especially for code & world knowledge; 2M long context',
        maximumOutputTokens: 8192,
        maximumTemperature: 2.0,
    },
    adapter: GoogleLLMAdapter,
});

// Register Google: Gemini 2.0 Flash-Lite
registerLLM({
    definition: {
        name: 'Google: Gemini 2.0 Flash-Lite',
        provider: 'google',
        id: 'gemini-2.0-flash-lite',
        description: 'Our cost effective offering to support high throughput',
        maximumOutputTokens: 8192,
        maximumTemperature: 2.0,
    },
    adapter: GoogleLLMAdapter,
});

// Does not support custom functions, "Function calling is not enabled for models"
// registerLLM({
//   definition: {
//     name: 'Google: Gemini 2.0 Flash Thinking',
//     provider: 'google',
//     id: 'gemini-2.0-flash-thinking-exp-01-21',
//     description:
//       'Provides stronger reasoning capabilities and includes the thinking process in responses',
//     // Add additional properties if needed
//   },
//   adapter: GoogleLLMAdapter,
// });
