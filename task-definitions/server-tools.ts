import {
    ServerToolsBase,
    Tool,
    ToolParameter,
} from '@/lib/task-definition-types';

export class CustomServerTools extends ServerToolsBase {
    @Tool('getWeather', 'This is a tool to get the weather')
    public async gw(
        @ToolParameter('location', 'This is the location')
        location: string,
        @ToolParameter('unit', 'Return the temperature in Celsius or Fahrenheit')
        unit: 'Celsius' | 'Fahrenheit' = 'Celsius',
    ) {
        if (location === 'San Francisco') {
            return `The weather in ${location} in ${unit} is foggy.`;
        }
        if (location === 'Seattle') {
            return `The weather in ${location} in ${unit} is rainy.`;
        }
        if (location === 'Austin') {
            return `The weather in ${location} in ${unit} is hot.`;
        }
        return `The weather in ${location} is unimaginably awful`;
    }

    @Tool('saveMemory', 'This is a tool to save a memory')
    public async sm(
        @ToolParameter('favColor', 'Your favorite color in number form')
        persistance: number
    ) {
        console.log('saveMemory is awesome');
    }
}
