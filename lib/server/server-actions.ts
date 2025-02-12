import { ToolsBuilder } from '@/lib/tools-builder';


export async function executeServerTool(now: Date, timeZone: string, functionName: string, functionArgs: any) {
    const builder = new ToolsBuilder();
    const result = builder.callServerTool(functionName, functionArgs);
    return result;
}