'use client';

import ChatBot from '@/app/_components/chat-bot';
import { useState } from 'react';
import { ToolCall } from '@/lib/message';

export default function ChatContainer() {
  const [showTextMessageConsent, setShowTextMessageConsent] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [consentResolver, setConsentResolver] = useState<(value: any) => void>();


  const showTextMessageConsentForm = (): Promise<{ consent: boolean; phone:string; timeZone: string } | null> => {
    return new Promise((resolve) => {
      setConsentResolver(() => resolve);
      setShowTextMessageConsent(true);
    });
  };

  const handleConsent = (consent: boolean, phone:string) => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setShowTextMessageConsent(false);
    if (consentResolver) {
      consentResolver({ consent, phone, timeZone });
    }
  };

  const handleClose = () => {
    setShowTextMessageConsent(false);
    if (consentResolver) {
      consentResolver(null);
    }
  };



  const functionCallHandler = async (now:Date, timeZone:string, toolCall: ToolCall) => {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);
    let result = "";

    console.log('calling function', functionName);
    console.log('function arguments', functionArgs);



    // Execute client tools
    if (functionName === 'transition') {
      sessionStorage.removeItem('stateName');
      return "Successfully transitioned to new state.";
    }

    if (functionName === 'showTextMessageConsent') {
      const result = await showTextMessageConsentForm();
      functionArgs.consent = result?.consent;
      functionArgs.phone = result?.phone;
      functionArgs.timeZone = result?.timeZone;
    }
    
    // Execute server tools
    //result = await executeAction(now, timeZone, functionName, functionArgs);
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