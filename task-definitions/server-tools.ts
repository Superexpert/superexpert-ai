import {ServerTool, ServerToolParameter} from '@/lib/task-types';


export class ServerTools {
  
    @ServerTool('getWeather', 'This is a tool to get the weather')
    public async gw(
      @ServerToolParameter('location', 'This is the location')
      location:string,
      @ServerToolParameter('favNumber', 'This is your favorite number')
      favNumber:number,
      @ServerToolParameter('favColor', 'Your favorite color')
      favColor: 'red'|'blue'|'green',
    )
    {
      console.log('getWeather is awesome');
      return `The weather in ${location} is god awful`;
    }


    @ServerTool('saveMemory', 'This is a tool to save a memory')
    public async sm(
      @ServerToolParameter('favColor', 'Your favorite color in number form')
      persistance: number,
    )
    {
      console.log('saveMemory is awesome');
    }


}
  