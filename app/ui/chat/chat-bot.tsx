'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './chat-bot.module.css';
import { ThreeDot } from 'react-loading-indicators';
import { Message, MessageProps } from '@/app/ui/chat/message';
import { MessageAI, ToolCall } from '@/lib/message';
import { START_MESSAGE } from '@/superexpert.config';
import { executeServerTool } from '@/lib/server/server-actions';
import { ClientToolsBuilder } from '@/lib/client-tools-builder';
import { ClientContext } from '@/lib/client/client-context';

const getNow = () => {
    return new Date();
};

const getTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

type ChatBotProps = {
    agentId: string;
    agentName: string;
};

const ChatBot = ({ agentId, agentName }: ChatBotProps) => {
    const [userInput, setUserInput] = useState('');
    // const [threadId, setThreadId] = useState(crypto.randomUUID());
    // const [taskName, setTaskName] = useState('home');
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [inputDisabled, setInputDisabled] = useState(true);
    const [busyWaiting, setBusyWaiting] = useState(false);

    const queuedMessagesRef = useRef<MessageAI[]>([]);
    const threadIdRef = useRef(crypto.randomUUID());
    const taskNameRef = useRef('home');

    const inputRef = useRef<HTMLInputElement>(null);

    const isInitialStartSentRef = useRef(false); // Track if "start" has been sent

    const sendMessages = async (messages: MessageAI[]) => {
        console.log(`New Send Messages with threadId ${threadIdRef.current}`);
        console.dir(messages, { depth: null });
        try {
            setBusyWaiting(true);
            setInputDisabled(true);
            const response = await fetch(`/${agentName}/api/ai`, {
                method: 'POST',
                body: JSON.stringify({
                    nowString: getNow().toISOString(),
                    timeZone: getTimeZone(),
                    task: taskNameRef.current,
                    thread: threadIdRef.current,
                    messages,
                }),
            });

            if (!response.body) return;

            handleTextCreated();

            const toolCalls = [];
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: isDone } = await reader.read();
                done = isDone; // Update loop condition

                if (!value) continue;

                const chunk = decoder.decode(value, { stream: true }); // Decode the chunk

                // **Parse the chunk to extract JSON**
                const events = chunk.split('\n'); // Split by newline to handle multiple messages

                for (const line of events) {
                    if (line.startsWith('data: ')) {
                        // Only process "data:" lines
                        try {
                            const jsonPart = line.replace('data: ', '').trim(); // Remove "data: "
                            const parsed = JSON.parse(jsonPart); // Convert to JSON

                            if (parsed.text) {
                                handleTextDelta(parsed.text); // Process extracted text
                            }

                            if (parsed.toolCall) {
                                toolCalls.push(parsed.toolCall); // Store tool calls
                            }
                        } catch (error) {
                            console.error(
                                'Failed to parse JSON from chunk:',
                                error,
                                line
                            );
                        }
                    }
                }
            }

            if (toolCalls.length > 0) {
                handleToolCalls(toolCalls);
            }
        } catch (error) {
            console.error('Error sending message', error);
            appendMessage(
                'assistant',
                'My brain went offline for a sec — classic ‘AI brain fog.’ Trying to reboot my wisdom!'
            );
        } finally {
            setBusyWaiting(false);
            setInputDisabled(false);
        }
    };

    // automatically scroll to bottom of chat
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendInitialStartMessage = async () => {
        // if (!isInitialStartSentRef.current) {
        //     isInitialStartSentRef.current = true;
            await sendMessages([{ role: 'user', content: START_MESSAGE }]);
        // }
    };

    // Send start message
    useEffect(() => {
        console.log("thread changed");
        sendInitialStartMessage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!inputDisabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [inputDisabled]);

    const celebrateSuccess = () => {
        const images = [
            '/success/cool-gold-badge.gif',
            '/success/bird-success.gif',
            '/success/rocket-launch.gif',
        ];
        const randomIndex = Math.floor(Math.random() * images.length);
        const src = images[randomIndex];

        appendMessage('success', src);
    };

    const handleSubmit = (e: { preventDefault: () => void }) => {
        e.preventDefault();
        if (!userInput.trim()) return;
        sendMessages([{ role: 'user', content: userInput }]);
        setMessages((prevMessages) => [
            ...prevMessages,
            { role: 'user', text: userInput },
        ]);
        setUserInput('');
        scrollToBottom();
    };

    const handleToolCalls = async (toolCalls: ToolCall[]) => {
        const toolMessages: MessageAI[] = [];
        for (const toolCall of toolCalls) {
            // if (toolCall.function.name === 'celebrateSuccess') {
            //     celebrateSuccess();
            //     toolMessages.push({
            //         role: 'tool',
            //         content: 'Success message displayed.',
            //         tool_call_id: toolCall.id,
            //     });
            // } else {

            const result = await functionCallHandler(
                getNow(),
                getTimeZone(),
                toolCall
            );
            toolMessages.push({
                role: 'tool',
                content: result,
                tool_call_id: toolCall.id,
            });
            // }
        }
        await sendMessages(toolMessages);

        // These are messages that were queued while waiting for the tool calls to complete
        console.log(`queuedMessages: ${queuedMessagesRef.current.length}`);
        console.dir(queuedMessagesRef, { depth: null });
        if (queuedMessagesRef.current.length > 0) {
            console.log(`sending queued messages`);
            const messagesToSend = [...queuedMessagesRef.current];
            queuedMessagesRef.current = []; // Reset the queue
            await sendMessages(messagesToSend);
        }
    };

    // textCreated - create new assistant message
    const handleTextCreated = () => {
        appendMessage('assistant', '');
    };

    // textDelta - append text to last assistant message
    const handleTextDelta = (delta: string) => {
        appendToLastMessage(delta);
    };

    // handleRunCompleted - re-enable the input form
    const handleRunCompleted = async () => {
        setInputDisabled(false);
        setBusyWaiting(false);
    };

    /*
    ===============================================
    === Handle Server and Client Function Calls ===
    ===============================================
    */

    /*** Client Context */

    const setTask = (taskName: string) => {
        console.log('setting task to', taskName);
        //setTaskName(taskName);
        taskNameRef.current = taskName;
    };

    const getTask = () => {
        return taskNameRef.current;
    };

    const setThread = (threadId: string) => {
        console.log('setting threadId to', threadId);
        threadIdRef.current = threadId;
    };

    const getThread = () => {
        return threadIdRef.current;
    };

    const showModal = () => {
        alert('show modal');
    };

    const hideModal = () => {
        alert('hide modal');
    };

    const sendQueuedMessages =  async (messages: MessageAI[]) => {
        console.log(`sendQueuedMessages called ${messages.length}`);
        queuedMessagesRef.current = [...queuedMessagesRef.current, ...messages];
    };

    const clientContext = new ClientContext(
        setTask,
        getTask,
        setThread,
        getThread,
        sendQueuedMessages,
        showModal,
        hideModal,
    );

    const functionCallHandler = async (
        now: Date,
        timeZone: string,
        toolCall: ToolCall
    ) => {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        // Execute client tool
        const clientToolsBuilder = new ClientToolsBuilder();
        const clientTool = clientToolsBuilder.getClientTool(functionName);
        if (clientTool) {
            const result = await clientToolsBuilder.callClientTool(
                clientContext,
                clientTool.methodName,
                functionArgs
            );
            console.log('client tool result', result);
            return Promise.resolve(result);
        }

        // Execute server tool
        const result = await executeServerTool(
            now,
            timeZone,
            functionName,
            functionArgs
        );
        console.log('server tool result', result);
        return Promise.resolve(result);
    };

    /*
    =======================
    === Utility Helpers ===
    =======================
    */

    const appendToLastMessage = (text: string) => {
        setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            const updatedLastMessage = {
                ...lastMessage,
                text: lastMessage.text + text,
            };
            return [...prevMessages.slice(0, -1), updatedLastMessage];
        });
    };

    const appendMessage = (
        role: 'user' | 'assistant' | 'success',
        text: string
    ) => {
        setMessages((prevMessages) => [...prevMessages, { role, text }]);
    };

    return (
        <div>
            <h1>{taskNameRef.current}</h1>
            <div className={styles.chatContainer}>
                <div className={styles.messages}>
                    {messages.map((msg, index) => (
                        <Message key={index} role={msg.role} text={msg.text} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                {busyWaiting && (
                    <div>
                        <ThreeDot
                            color="#32cd32"
                            size="medium"
                            text=""
                            textColor=""
                        />
                    </div>
                )}
                <form
                    onSubmit={handleSubmit}
                    className={`${styles.inputForm} ${styles.clearfix}`}>
                    <input
                        ref={inputRef}
                        type="text"
                        disabled={inputDisabled}
                        className={styles.input}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Enter your response"
                    />
                    <button
                        type="submit"
                        className={styles.button}
                        disabled={inputDisabled}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBot;

// https://github.com/openai/openai-assistants-quickstart/blob/main/app/components/chat.tsx
