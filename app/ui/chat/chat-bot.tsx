'use client';

import React, {
    useState,
    useEffect,
    useRef,
    ReactNode,
    ReactElement,
} from 'react';
import styles from '@/styles/chat-bot/default.module.css';
import { ThreeDot } from 'react-loading-indicators';
import { Message, MessageProps } from '@/app/ui/chat/message';
import { MessageAI, ToolCall } from '@/lib/message';
import { CHAT_ERROR_MESSAGE, START_MESSAGE } from '@/superexpert.config';
import { executeServerTool } from '@/lib/actions/server-actions';
import { ClientToolsBuilder } from '@/lib/client-tools-builder';
import { ClientContext } from '@/lib/client/client-context';
import { ClientTaskDefinition } from '@/lib/client/client-task-definition';
import Modal from '@/app/ui/modal';

const getNow = () => {
    return new Date();
};

const getTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

type ChatBotProps = {
    agentId: string;
    agentName: string;
    tasks: ClientTaskDefinition[];
};

const ChatBot = ({ agentName, tasks }: ChatBotProps) => {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [inputDisabled, setInputDisabled] = useState(true);
    const [busyWaiting, setBusyWaiting] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<ReactNode>(null);

    const queuedMessagesRef = useRef<MessageAI[]>([]);
    const threadIdRef = useRef(crypto.randomUUID());
    const taskNameRef = useRef('home');
    const mainContentRef = useRef<HTMLDivElement | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    const sendMessages = async (messages: MessageAI[]) => {
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
            appendMessage('assistant', CHAT_ERROR_MESSAGE);
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
        await sendMessages([{ role: 'user', content: START_MESSAGE }]);
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
        await sendMessages(toolMessages);

        // These are messages that were queued while waiting for the tool calls to complete
        if (queuedMessagesRef.current.length > 0) {
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

  
    /*
    ===============================================
    === Handle Server and Client Function Calls ===
    ===============================================
    */

    /*** Client Context */

    const getCurrentTask = () => {
        const task = tasks.find((t) => t.name === taskNameRef.current);
        if (!task) {
            throw new Error('Task not found');
        }
        return task;
    };

    const getTask = (taskName: string) => {
        const task = tasks.find((t) => t.name === taskName);
        return task ?? null;
    };

    const setTask = (taskName: string) => {
        console.log('setting task to', taskName);
        taskNameRef.current = taskName;
    };

    const getCurrentThread = () => {
        return threadIdRef.current;
    };

    const setThread = (threadId: string) => {
        console.log('setting threadId to', threadId);
        threadIdRef.current = threadId;
    };

    const showModal = async (
        ContentComponent: (props: {
            onSubmit: (result: string) => void;
        }) => ReactElement
    ) => {
        return new Promise<string>((resolve) => {
            const onSubmit = (result: string) => {
                if (mainContentRef.current) {
                    mainContentRef.current.removeAttribute('inert');
                }
                setIsModalVisible(false);
                resolve(result);
            };
            // Prevents users from clicking on the main content while the modal is open
            if (mainContentRef.current) {
                mainContentRef.current.setAttribute('inert', 'true');
            }
            setModalContent(<ContentComponent onSubmit={onSubmit} />);
            setIsModalVisible(true);
        });
    };

    const hideModal = () => {
        setIsModalVisible(false);
        setModalContent(null);
    };

    const sendQueuedMessages = async (messages: MessageAI[]) => {
        console.log(`sendQueuedMessages called ${messages.length}`);
        queuedMessagesRef.current = [...queuedMessagesRef.current, ...messages];
    };

    const clientContext = new ClientContext(
        tasks,
        getCurrentTask,
        getTask,
        setTask,
        getCurrentThread,
        setThread,
        sendQueuedMessages,
        showModal,
        hideModal
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
            <div className={styles.chatContainer} ref={mainContentRef}>
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
            <Modal isVisible={isModalVisible}>{modalContent}</Modal>
        </div>
    );
};

export default ChatBot;

// https://github.com/openai/openai-assistants-quickstart/blob/main/app/components/chat.tsx
