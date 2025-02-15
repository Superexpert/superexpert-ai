import {ServerDataRegistry, ServerDataBase, ServerData} from '@/lib/task-definition-types';


export class CustomServerData extends ServerDataBase {
  
    @ServerData('getWeather', 'This is a tool to get the weather')
    public async loadMemories()
    {
      console.log('Retrieing memories');
      return `I remember you like red`;
    }

}

ServerDataRegistry.register("My Server Data", CustomServerData);
