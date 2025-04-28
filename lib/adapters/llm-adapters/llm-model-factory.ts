
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

 





