import { MessageAI } from '@/lib/message-ai';
import { ToolAI } from '@/lib/tool-ai';
import { LLMModelFactory } from '@/lib/adapters/llm-adapters/llm-model-factory';

/***********
 * Known Issue: Gemini 2.0 Flash will return MALFORMED_FUNCTION_CALL 
 * when asked to do multiple function but this issue does not impact
 * Gemini 2.0 Pro.
 * 
 * The best workaround for this issue is to use prompt engineering
 * to tell Gemini to only call one function at a time. (in the Instructions)
 */



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
              description: 'Return the temperature in Celsius or Fahrenheit'
            }
          },
          required: [ 'location', 'unit' ]
        }
      }
    }
  ];

  const inputMessages: MessageAI[] = [
    { role: 'user', content: 'Hello' },
    {
        role: 'assistant',
        content: 'Hello! How can I help you today?\n',
    },
    {
        role: 'user',
        content:
            'What is the weather in Paris, France and Austin and San Francisco in Celsius?',
    },
    {
        role: 'assistant',
        content: '...',
        tool_calls: [
            {
                id: 'getWeather',
                type: 'function',
                function: {
                    name: 'getWeather',
                    arguments:
                        '{"unit":"Celsius","location":"Paris, France"}',
                },
            },
            {
                id: 'getWeather',
                type: 'function',
                function: {
                    name: 'getWeather',
                    arguments: '{"location":"Austin","unit":"Celsius"}',
                },
            },
            {
                id: 'getWeather',
                type: 'function',
                function: {
                    name: 'getWeather',
                    arguments:
                        '{"location":"San Francisco","unit":"Celsius"}',
                },
            },
        ],
    },
    {
        role: 'tool',
        content: 'The weather in Paris, France is unimaginably awful',
        tool_call_id: 'getWeather',
    },
    {
        role: 'tool',
        content: 'The weather in Austin in Celsius is hot.',
        tool_call_id: 'getWeather',
    },
    {
        role: 'tool',
        content: 'The weather in San Francisco in Celsius is foggy.',
        tool_call_id: 'getWeather',
    },
    {
        role: 'assistant',
        content:
            'The weather in Paris, France is unimaginably awful. The weather in Austin in Celsius is hot. The weather in San Francisco in Celsius is foggy.\n',
    },
    {
        role: 'user',
        content:
            'What is the weather in San Francisco, Modesto, and LA?',
    },
    {
        role: 'assistant',
        content:
            'What units would you like the temperature in? Celsius or Fahrenheit?\n',
    },
    { role: 'user', content: 'Celsius' },
];

describe('Complex function calling ', () => {


    it('with Gemini 2.0 Pro works correctly', async () => {

        // Arrange
        const adapter = LLMModelFactory.createModel('gemini-2.0-pro-exp-02-05');

        // Act        
        const generator = adapter.generateResponse(
            'You are a helpful assistant.',
            inputMessages,
            tools,
            {}
        );
        let results = [];
        for await (const result of generator) {
            results.push(result);
        }
        //console.dir(results, { depth: null });
    }),

    it('with Gemini 2.0 Flash results in MALFORMED_FUNCTION_CALL', async () => {
        // Act
        const adapter = LLMModelFactory.createModel('gemini-2.0-flash');
    
        // Correctly test for async rejections using await expect().rejects
        await expect(async () => {
            const generator = adapter.generateResponse(
                'You are a helpful assistant.',
                inputMessages,
                tools,
                {}
            );
            
            let results = [];
            for await (const result of generator) {
                results.push(result);
            }
        }).rejects.toThrow('MALFORMED_FUNCTION_CALL')
    });
});
