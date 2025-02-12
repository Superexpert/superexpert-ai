'use client';

import ChatBot from '@/app/_components/chat-bot';
import { ToolCall } from '@/lib/message';
import { executeServerTool } from '@/lib/server/server-actions';
import { ClientToolsBuilder } from '@/lib/client-tools-builder';
import { GlobalClientTools } from '@/lib/task-definitions/global-client-tools';

export default function ChatContainer() {
 



  const functionCallHandler = async (now:Date, timeZone:string, toolCall: ToolCall) => {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);
    let result = "";

    console.log('calling function', functionName);
    console.log('function arguments', functionArgs);
    console.log('function arguments type', typeof functionArgs);

    // Execute client tool
    const clientToolsBuilder = new ClientToolsBuilder();
    const clientTool = clientToolsBuilder.getClientTool(functionName);
    if (clientTool) {
      const methodName = clientTool.methodName as keyof GlobalClientTools;
      const instance = new GlobalClientTools();
      if (methodName in instance && typeof instance[methodName] === "function") {
        const args = Object.values(functionArgs); // Extracts values in object key order
        result = await (instance[methodName] as Function)(...args); // Explicitly cast as Function
        console.log('result', result);
        return Promise.resolve(result);
      } else {
        console.error(`Method ${methodName} does not exist on GlobalClientTools`);
      }
    }


    // Execute server tool
    result = await executeServerTool(now, timeZone, functionName, functionArgs);
    console.log('result', result);

    return Promise.resolve(result);
  };

  
  return (
    <div className="mx-auto max-w-[800px]">
      <div>
        <ChatBot functionCallHandler={functionCallHandler} /> 
      </div>
    </div>
  );
}