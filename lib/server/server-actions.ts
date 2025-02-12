import { ServerToolsBuilder } from '@/lib/server-tools-builder';


export async function executeServerTool(now: Date, timeZone: string, functionName: string, functionArgs: any) {
    const builder = new ServerToolsBuilder();
    const result = builder.callTool(functionName, functionArgs);
    return result;
}