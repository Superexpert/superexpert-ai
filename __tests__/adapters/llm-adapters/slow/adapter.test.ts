import 'openai/shims/node';
import { LLMModelFactory } from '@/lib/adapters/llm-adapters/llm-model-factory';
import { ToolAI } from '@/lib/tool-ai';
import { MessageAI } from '@/lib/message-ai';

/***********
 *
 * This test suite is for testing the LLM adapters of the models.
 * It verifies that the models can generate responses correctly
 * when prompted with specific instructions and input messages.
 *
 * The test cases iterate through all available models and check their responses.
 *
 * The expected response is that the model should mention "George Washington"
 * when asked about the first president of the United States.
 *
 * The test is set to timeout after 60 seconds because this is a long-running tests.
 */

const models = LLMModelFactory.getAvailableModels();
const testCases = models.map((model) => [model.id, model.name]);

describe('Adapter tests', () => {
    test.each(testCases)(
        'should work with model: %s (%s)',
        async (modelId, modelName) => {
            // Arrange
            const adapter = LLMModelFactory.createModel(modelId);
            const instructions = 'You are a helpful assistant.';
            const inputMessages: MessageAI[] = [
                {
                    role: 'user',
                    content:
                        'Who was the first president of the United States?',
                },
            ];
            const tools: ToolAI[] = [];
            const options = {};

            // Act
            let results = '';
            const generator = adapter.generateResponse(
                instructions,
                inputMessages,
                tools,
                options
            );
            for await (const result of generator) {
                results += result.text;
            }

            // Assert
            expect(results).toContain('George Washington');
        },
        1000 * 60
    );
});
