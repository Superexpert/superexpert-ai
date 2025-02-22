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
        @ToolParameter('favNumber', 'This is your favorite number')
        favNumber: number,
        @ToolParameter('favColor', 'Your favorite color')
        favColor: 'red' | 'blue' | 'green'
    ) {
        console.log('getWeather is awesome');
        return `The weather in ${location} is god awful`;
    }

    @Tool('saveMemory', 'This is a tool to save a memory')
    public async sm(
        @ToolParameter('favColor', 'Your favorite color in number form')
        persistance: number
    ) {
        console.log('saveMemory is awesome');
    }
}
