import 'openai/shims/node';
import { OpenAIAdapter } from '@/lib/models/openai-adapter';
import { AIModelFactory } from '@/lib/models/ai-model-factory';

const models = AIModelFactory.getAvailableModels()
    .filter(model => model.id !== 'claude-3-7-sonnet-20250219') // Claude 3.7 Sonnet will work with thinking enabled
    .filter(model => model.provider !== 'google'); // Google models do not support parallel function calls


const testCases = models.map(model => [model.id, model.name]);

const tools = [
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
    },
    {
        type: 'function',
        function: {
          name: 'getMovies',
          description: 'This is a tool to get a list of available movies in a location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'This is the location' },
            },
            required: [ 'location' ]
          }
        }
      }
  ];



  describe('Adapter Multiple Function Tests', () => {
    test.each(testCases)(
        'should work with model: %s (%s)',
        async (modelId, modelName) => {
            // Arrange
            const adapter = AIModelFactory.createModel(modelId);
            const instructions = 'You are a helpful assistant.';
            const inputMessages = [{
                role: 'user',
                //content: 'What is the current weather in San Francisco in Fahrenheit?'
                //content: "Please provide two pieces of information: 1) the current weather in San Francisco in Fahrenheit, and 2) a list of movies currently being shown in San Francisco. Use the appropriate tools for each request."
                //content: "Call both the getMovies and getWeather functions for San Francisco at the same time. Do not call these functions in sequence. For getWeather, use Fahrenheit as the unit."
                content: "Please retrieve both the current weather (in Fahrenheit) and the list of movies playing in San Francisco. These function calls should be executed in parallel."
            }];
            const options = {};
    
            // Act
            let results = [];
            const generator = adapter.generateResponse(instructions, inputMessages, tools, options);
            for await (const result of generator) {
                //console.log("result:");
                //console.dir(result, { depth: null });
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
                            ...item.toolCall.function,
                            arguments: JSON.parse(item.toolCall.function.arguments),
                    },
                },
            }));

    
            // Assert
            /* Expect the response to contain the weather and movies in San Francisco
            [
             {
                 "toolCall": 
                     {
                         "function": {
                             "arguments": "{\"location\":\"San Francisco\",\"unit\":\"Fahrenheit\"}", 
                             "name": "getWeather"
                         }, 
                         "id": "call_5lmiVsGtB5mg6b1FqVAUYDCV", 
                         "type": "function"
                     }
             },
             {
                toolCall: 
                    {
                        index: 1,
                        id: 'call_HqMK6klGYmLcp95S4VQvshOI',
                        type: 'function',
                        function: { 
                            name: 'getMovies', 
                            arguments: '{"location": "San Francisco"}' }
                        }
             }
            ]
            */

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
                  expect.objectContaining({
                    toolCall: expect.objectContaining({
                      function: expect.objectContaining({
                        arguments: {
                          location: 'San Francisco',
                        },
                        name: 'getMovies',
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
