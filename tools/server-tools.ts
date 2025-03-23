import { registerServerTool } from '@superexpert-ai/framework';


registerServerTool({
    name: 'getWeather',
    description: 'Get the weather for the specified location',
    parameters: [
        {
            name: 'location',
            description: 'location to get the weather',
            enum: ['Boston', 'Paris'],
        },
    ],
    function(location: string) {
        //const userId = this.context.user.id;
        return `User: The weather in ${location} is awful!`;
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
