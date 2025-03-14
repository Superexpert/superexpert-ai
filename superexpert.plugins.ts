import { SystemServerData } from './lib/task-definitions/system-server-data';
import { CustomServerData } from './task-definitions/server-data';
import { SystemServerTools } from './lib/task-definitions/system-server-tools';
import { CustomServerTools } from './task-definitions/server-tools';
import { SystemClientTools } from './lib/task-definitions/system-client-tools';
import { CustomClientTools } from './task-definitions/client-tools';

const plugins = {
    ServerData: [
        SystemServerData,
        CustomServerData,
    ],
    ServerTools: [
        SystemServerTools,
        CustomServerTools,
    ],
    ClientTools: [
        SystemClientTools,
        CustomClientTools,
    ],
};
  
export default plugins;