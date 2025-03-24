import { registerServerTool } from '@superexpert-ai/framework';
import { prisma } from '@/lib/db/prisma';


registerServerTool({
    name: 'getWeather',
    description: 'Get the weather for the specified location',
    parameters: [
        {
            name: 'location',
            type: 'string',
            description: 'location to get the weather',
            enum: ['Boston', 'Paris'],
        },
        {
            name: 'unit',
            type: 'string',
            description: 'location to get the weather',
            enum: ['celsius', 'fahrenheit'],
            required: false,
        },
 
    ],
    function(location: string, unit: 'celsius' | 'fahrenheit' = 'celsius') {
        const userId = this.user.id;
        return `User ${userId}: The weather in ${location} is awful in ${unit}!`;
    },
});


registerServerTool({
    name: 'remember',
    description: 'Remember something for a duration of time',
    parameters: [
        {
            name: 'content',
            type: 'string',
            description: 'The something to remember',
        },
        {
            name: 'duration',
            type: 'string',
            description: 'The duration for which to remember the content. Defaults to "day" if not specified.',
            enum: ['day', 'week', 'month', 'quarter', 'year', 'forever'],
            required: false,
            default: 'day',
        },
 
    ],
    async function(content: string, duration: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'forever' = 'day') {
        const expiresInDays = {
            day: 1,
            week: 7,
            month: 30,
            quarter: 90,
            year: 365,
            forever: 365 * 100, // Arbitrary large number for "forever"
        }[duration];

        console.log(`User ${this.user.id} wants to remember "${content}" for ${duration} (${expiresInDays} days) for agent ${this.agent.id}`);

        await prisma.memories.create({
            data: {
                userId: this.user.id,
                agentId: this.agent.id,
                content: content,
                expiresInDays: expiresInDays,
            },
        });
        return `User ${this.user.id}: I will remember "${content}" for ${duration}.`;
    },
});





// import {
//     registerServerTool,
//     ServerToolsBase,
//     Tool,
//     ToolParameter,
// } from '@superexpert-ai/framework';

// export class CustomServerTools extends ServerToolsBase {
//     @Tool({
//         name: 'getWeather',
//         description:
//             'This is a tool to get a description of the weather in plain language. For example, "The weather in San Francisco in Celsius is foggy or unimaginably awful."',
//     })
//     public async gw(
//         @ToolParameter({
//             name: 'location',
//             description: 'This is the location',
//         })
//         location: string,
//         @ToolParameter({
//             name: 'unit',
//             description: 'Return the temperature in Celsius or Fahrenheit',
//             enumValues: ['Celsius', 'Fahrenheit'],
//         })
//         unit: 'Celsius' | 'Fahrenheit' = 'Celsius'
//     ) {
//         if (location === 'San Francisco') {
//             return `The weather in ${location} in ${unit} is foggy.`;
//         }
//         if (location === 'Seattle') {
//             return `The weather in ${location} in ${unit} is rainy.`;
//         }
//         if (location === 'Austin') {
//             return `The weather in ${location} in ${unit} is hot.`;
//         }
//         return `The weather in ${location} is unimaginably awful`;
//     }

//     @Tool({
//         name: 'saveMemory',
//         description: 'This is a tool to save a memory',
//     })
//     public async sm(
//         @ToolParameter({
//             name: 'favColor',
//             description: 'Your favorite color in number form',
//         })
//         persistance: number
//     ) {
//         console.log('saveMemory is awesome');
//     }

//     @Tool({
//         name: 'whichAgent',
//         description: 'This tool returns the current agent id',
//     })
//     public async whichAgent() {
//         return `I am ${this.agent.id} with name ${this.agent.name} and I am awesome`;
//     }
// }

// registerServerTool(CustomServerTools);
