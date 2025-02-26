import { AIModel } from '@/lib/models/ai-model';
import { GPT4oModel } from '@/lib/models/gpt4o';
import { GoogleAIModel } from './google-ai-model';

export class AIModelFactory {
  static createModel(provider: string): AIModel {
    switch (provider.toLowerCase()) {
      case "gpt-4o":
        return new GPT4oModel();
      case "gemini":
        return new GoogleAIModel();
      case "claude":
        return new GPT4oModel();
      default:
        throw new Error("Unsupported AI model provider");
    }
  }
}