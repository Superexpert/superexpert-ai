import { LLMModelFactory } from '@/lib/adapters/llm-adapters/llm-model-factory';
import { MessageAI } from '@superexpert-ai/framework';
import '@/lib/adapters/llm-adapters/system-adapters';

describe('Adapter Map Messages', () => {
    it('should map Google messages to Content', async () => {
        // Arrange
        const messages: MessageAI[] = [
            {
                role: 'user',
                content: 'What is the capital of France?',
            },
        ];
        // Act
        const modelId = 'gemini-2.0-flash';
        const adapter = LLMModelFactory.createModel(modelId, {
            temperature: 0.7,
            maximumOutputTokens: 2048,
        });
        const results = adapter.mapMessages(messages);
        console.dir(results, { depth: null, colors: true });

        // Assert
        expect(results).toEqual([
            {
                role: 'user',
                parts: [{ text: 'What is the capital of France?' }],
            },
        ]);
    });
});
