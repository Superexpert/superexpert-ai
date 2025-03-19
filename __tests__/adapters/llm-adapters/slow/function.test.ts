import { LLMModelFactory } from '@/lib/adapters/llm-adapters/llm-model-factory';
import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';


/***********
 * 
 * This test suite is for testing the function adapter of the LLM models.
 * It verifies that the models can correctly call a function (getWeather)
 * when prompted with a specific instruction.
 */

const models = LLMModelFactory.getAvailableModels();

const testCases = models.map(model => [model.id, model.name]);

const tools: ToolAI[] = [
    {
      type: 'function',
      function: {
        name: 'getWeather',
        description: 'This is a tool to get the weather',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'This is the location' },
            unit: {
              type: 'string',
              description: 'Return the temperature in Celcius or Fahrenheit'
            }
          },
          required: [ 'location', 'unit' ]
        }
      }
    }
  ];



  describe('Adapter Function Tests', () => {
    test.each(testCases)(
        'should work with model: %s (%s)',
        async (modelId, modelName) => {
            // Arrange
            const adapter = LLMModelFactory.createModel(modelId);
            const instructions = 'You are a helpful assistant. Call the getWeather function when asked about the weather.';
            const inputMessages: MessageAI[] = [{
                role: 'user',
                content: 'What is the weather in San Francisco in Fahrenheit?'
            }];
            const options = {};
    
            // Act
            let results = [];
            const generator = adapter.generateResponse(instructions, inputMessages, tools, options);
            for await (const result of generator) {
                results.push(result);
            }
    
            // Parse the arguments JSON strings into objects - otherwise, the 
            // order of the parameters in the JSON string can cause the test to fail
            const parsedResults = results
                .filter(item => item.toolCall) // Filter out non-toolCall items
                .map(item => ({
                    ...item,
                    toolCall: {
                        ...item.toolCall,
                        function: {
                            ...item.toolCall?.function,
                            arguments: JSON.parse(item.toolCall?.function.arguments),
                    },
                },
            }));

    
            // Assert
            expect(parsedResults).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    toolCall: expect.objectContaining({
                      function: expect.objectContaining({
                        arguments: {
                          location: 'San Francisco',
                          unit: 'Fahrenheit',
                        },
                        name: 'getWeather',
                      }),
                      id: expect.any(String), // Ensures 'id' is a string
                      type: 'function',
                    }),
                  }),
                ])
            );
    
        }, 1000 * 60
    );

  });
