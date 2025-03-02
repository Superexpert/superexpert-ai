import 'openai/shims/node';
import { OpenAIAdapter } from '@/lib/models/openai-adapter';
import { AIModelFactory } from '@/lib/models/ai-model-factory';

//const models = AIModelFactory.getAvailableModels().filter(m => m.id === 'gemini-2.0-flash-thinking-exp-01-21');
const models = AIModelFactory.getAvailableModels();

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
    }
  ];

//   const tools = { function_declarations: [{
//       type: 'function',
//       function: {
//         name: 'getWeather',
//         description: 'This is a tool to get the weather',
//         parameters: {
//           type: 'object',
//           properties: {
//             location: { type: 'string', description: 'This is the location' },
//             unit: {
//               type: 'string',
//               description: 'Return the temperature in Celcius or Fahrenheit'
//             }
//           },
//           required: [ 'location', 'unit' ]
//         }
//       }
// }]};

//const tools = [];

  describe('Adapter Function Tests', () => {
    test.each(testCases)(
        'should work with model: %s (%s)',
        async (modelId, modelName) => {
            // Arrange
            const adapter = AIModelFactory.createModel(modelId);
            const instructions = 'You are a helpful assistant. Call the getWeather function when asked about the weather.';
            const inputMessages = [{
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
    
            console.log("results");
            console.dir(results, { depth: null });


            // Parse the arguments JSON strings into objects
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
            // Expect the response to contain the weather in San Francisco
            // [
            //  {
            //      "toolCall": 
            //          {
            //              "function": {
            //                  "arguments": "{\"location\":\"San Francisco\",\"unit\":\"Fahrenheit\"}", 
            //                  "name": "getWeather"
            //              }, 
            //              "id": "call_5lmiVsGtB5mg6b1FqVAUYDCV", 
            //              "type": "function"
            //          }
            //  }
            //]
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

    // test('should work with model: curie', async () => {
    //     // Arrange
    //     const adapter = new OpenAIAdapter('gpt-4o');
    //     const instructions = 'You are a helpful assistant.';
    //     const inputMessages = [
    //         {
    //             role: 'user',
    //             content: 'What is the weather in San Francisco?'
    //         }
    //     ];
    //     const options = {};

    //     // Act
    //     let results = [];
    //     const generator = adapter.generateResponse(instructions, inputMessages, tools, options);
    //     for await (const result of generator) {
    //         results.push(result);
    //     }

    //     console.dir(results, { depth: null });

    //     // Assert
    //     // Expect the response to contain the weather in San Francisco
    //     // [
    //     //  {
    //     //      "toolCall": 
    //     //          {
    //     //              "function": {
    //     //                  "arguments": "{\"location\":\"San Francisco\",\"unit\":\"Celsius\"}", 
    //     //                  "name": "getWeather"
    //     //              }, 
    //     //              "id": "call_5lmiVsGtB5mg6b1FqVAUYDCV", 
    //     //              "type": "function"
    //     //          }
    //     //  }
    //     //]
    //     expect(results).toEqual(
    //         expect.arrayContaining([
    //           expect.objectContaining({
    //             toolCall: expect.objectContaining({
    //               function: expect.objectContaining({
    //                 arguments: '{"location":"San Francisco","unit":"Celsius"}',
    //                 name: 'getWeather',
    //               }),
    //               id: expect.any(String), // Ensures 'id' is a string
    //               type: 'function',
    //             }),
    //           }),
    //         ])
    //       );
    //     });


    // }, 1000 * 60
    // );


    // test.each(testCases)(
    //     'should work with model: %s (%s)',
    //     async (modelId, modelName) => {
    //         // Arrange
    //         const adapter = AIModelFactory.createModel(modelId);
    //         const instructions = 'You are a helpful assistant.';
    //         const inputMessages = [{
    //         role: 'user',
    //         content: 'Who was the first president of the United States?'
    //         }];
    //         const tools = [];
    //         const options = {};
    
    //         // Act
    //         let results = '';
    //         const generator = adapter.generateResponse(instructions, inputMessages, tools, options);
    //         for await (const result of generator) {
    //         results += result.text;
    //         }
    
    //         // Assert
    //         expect(results).toContain('George Washington');
    //     }, 1000 * 60
    // );
// });