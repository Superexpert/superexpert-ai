'use client';

import ChatBot from '@/app/_components/chat-bot';
import { ToolCall } from '@/lib/message';
import { executeServerTool } from '@/lib/server/server-actions';

export default function ChatContainer() {
 



  const functionCallHandler = async (now:Date, timeZone:string, toolCall: ToolCall) => {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);
    let result = "";

    console.log('calling function', functionName);
    console.log('function arguments', functionArgs);

    
    // Execute server tools
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