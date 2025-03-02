import 'openai/shims/node';
import { OpenAIAdapter } from '@/lib/models/openai-adapter';
import { AIModelFactory } from '@/lib/models/ai-model-factory';

const models = AIModelFactory.getAvailableModels();
const testCases = models.map(model => [model.id, model.name]);

describe('Adapter tests', () => {
    test.each(testCases)(
        'should work with model: %s (%s)',
        async (modelId, modelName) => {
            // Arrange
            const adapter = AIModelFactory.createModel(modelId);
            const instructions = 'You are a helpful assistant.';
            const inputMessages = [{
            role: 'user',
            content: 'Who was the first president of the United States?'
            }];
            const tools = [];
            const options = {};
    
            // Act
            let results = '';
            const generator = adapter.generateResponse(instructions, inputMessages, tools, options);
            for await (const result of generator) {
            results += result.text;
            }
    
            // Assert
            expect(results).toContain('George Washington');
        }, 1000 * 60
    );
});

