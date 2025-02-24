'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './chat-bot.module.css';
import { ThreeDot } from 'react-loading-indicators';
import { ChatCompletionStream } from 'openai/lib/ChatCompletionStream';
import { Message, MessageProps } from '@/app/ui/chat/message';
import { MessageAI, ToolCall } from '@/lib/message';
import { getSessionItem, setSessionItem } from '@/lib/session-storage';

const getNow = () => {
    return new Date();
};

const getTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

const getTask = () => {
    const task = getSessionItem('task');
    if (task) {
        return task;
    }
    const newTask = 'home';
    setSessionItem('task', newTask);
    return newTask;
};

const getThread = (): string => {
    const thread = getSessionItem('thread');
    if (thread) {
        return thread;
    }
    const newThread = crypto.randomUUID();
    setSessionItem('thread', newThread);
    return newThread;
};

type ChatBotProps = {
    agentId: string;
    agentName: string;
    functionCallHandler?: (
        now: Date,
        timeZone: string,
        toolCall: ToolCall
    ) => Promise<string>;
};

const ChatBot = ({
    agentId,
    agentName,
    functionCallHandler = () => Promise.resolve(''),
}: ChatBotProps) => {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [inputDisabled, setInputDisabled] = useState(true);
    const [busyWaiting, setBusyWaiting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isInitialStartSentRef = useRef(false); // Track if "start" has been sent

    const sendMessages = async (messages: MessageAI[]) => {
        try {
            setBusyWaiting(true);
            setInputDisabled(true);
            const response = await fetch(`/${agentName}/api/ai`, {
                method: 'POST',
                body: JSON.stringify({
                    nowString: getNow().toISOString(),
                    timeZone: getTimeZone(),
                    task: getTask(),
                    thread: getThread(),
                    messages,
                }),
            });

            if (response.body) {
                const stream = ChatCompletionStream.fromReadableStream(
                    response.body
                );
                handleReadableStream(stream);
            }
        } catch (error) {
            console.error('Error sending message', error);
            appendMessage(
                'assistant',
                'My brain went offline for a sec — classic ‘AI brain fog.’ Trying to reboot my wisdom!'
            );
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
        if (!isInitialStartSentRef.current) {
            isInitialStartSentRef.current = true;
            const message = 'User has started a new conversation.';
            await sendMessages([{ role: 'system', content: message }]);
        }
    };

    // Send start message
    useEffect(() => {
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

    /* Stream Event Handlers */

    interface CustomChunk {
        id: string;
        content: string;
        tool_calls: ToolCall[];
    }

    // https://github.com/openai/openai-node/blob/HEAD/helpers.md#chat-events
    const handleReadableStream = (stream: ChatCompletionStream) => {
        let toolCalls: ToolCall[] = [];

        stream.on('message', (event) => {
            const message = event as unknown as CustomChunk;

            if (message.tool_calls.length > 0) {
                toolCalls = message.tool_calls;
            }
        });

        stream.on('chunk', (event) => {
            const delta = event.choices[0].delta;

            if (delta.role && delta.content == '') {
                // This indicates the start of a new message
                handleTextCreated();
            }

            if (delta.content) {
                // This is a part of the message content
                handleTextDelta(delta.content);
            }
        });

        stream.on('end', () => {
            if (toolCalls.length > 0) {
                handleToolCalls(toolCalls);
            }
            handleRunCompleted();
        });

        stream.on('error', (error) => {
            // Handle any errors that occur during streaming
            console.error('Stream error:', error);
        });
    };

    const handleToolCalls = async (toolCalls: ToolCall[]) => {
        const toolMessages: MessageAI[] = [];
        for (const toolCall of toolCalls) {
            if (toolCall.function.name === 'celebrateSuccess') {
                celebrateSuccess();
                toolMessages.push({
                    role: 'tool',
                    content: 'Success message displayed.',
                    tool_call_id: toolCall.id,
                });
            } else {
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
            }
        }
        sendMessages(toolMessages);
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
