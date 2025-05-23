'use client';

import '@/superexpert-ai.plugins.client';
import React, {
    useState,
    useEffect,
    useRef,
    ReactNode,
    ReactElement,
} from 'react';
import { Message, MessageProps } from '@/app/(chat)/ui/message';
import { CHAT_ERROR_MESSAGE, START_MESSAGE } from '@/superexpert-ai.config';
import { executeServerTool } from '@/lib/actions/server-actions';
import {
    ClientToolContext,
    ClientTaskDefinition,
    getTheme,
    MessageAI,
    ToolCall,
    getClientTool,
    callClientTool,
} from '@superexpert-ai/framework';
import Modal from '@/app/(chat)/ui/modal';
import { handleSignOut } from '@/lib/actions/server-actions';
import Image from 'next/image';

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

const ChatBot = ({ agentId, agentName, tasks }: ChatBotProps) => {
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

            const toolCalls = [];
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let hasText = false;
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
                                if (!hasText) {
                                    hasText = true; // Set flag to true on first text
                                    handleTextCreated();
                                }
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

    // Always open all chat links in a new window
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'A' && (target as HTMLAnchorElement).href) {
                event.preventDefault();
                window.open(
                    (target as HTMLAnchorElement).href,
                    '_blank',
                    'noopener,noreferrer'
                );
            }
        };

        document
            .getElementById('messages')!
            .addEventListener('click', handleClick);

        // Cleanup the event listener on component unmount
        return () => {
            document
                .getElementById('messages')!
                .removeEventListener('click', handleClick);
        };
    }, []);

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

    const getGlobalTask = () => {
        const task = tasks.find((t) => t.name === 'global');
        if (!task) {
            throw new Error('Global task not found');
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
        queuedMessagesRef.current = [...queuedMessagesRef.current, ...messages];
    };

    const clientContext = new ClientToolContext(
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
        const clientTool = getClientTool(functionName);
        if (clientTool) {
            const result = await callClientTool(
                clientTool.name,
                clientContext,
                functionArgs
            );
            console.log('client tool result', result);
            return Promise.resolve(result);
        }

        // Execute server tool
        const result = await executeServerTool(
            agentId,
            agentName,
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

    const appendMessage = (role: 'user' | 'assistant', text: string) => {
        setMessages((prevMessages) => [...prevMessages, { role, text }]);
    };

    // Determine the current theme
    const currentTheme =
        getCurrentTask().theme === 'global'
            ? getGlobalTask().theme
            : getCurrentTask().theme;

    const theme = getTheme(currentTheme);
    const styles = theme?.theme;

    return (
        <div className={styles.chatPage}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.headerLeft}>
                        {/* Logo */}
                        <div className={styles.logoContainer}>
                            <Image
                                src="/superexpert-ai-black-transparent.png"
                                alt="Logo"
                                className={styles.logo}
                                priority={true}
                                width={200}
                                height={39}
                            />
                        </div>
                        {/* Sign Out */}
                        <form
                            onSubmit={handleSignOut}
                            className={styles.signOutForm}>
                            <button
                                type="submit"
                                className={styles.signOutButton}>
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            <main className={styles.main}>
                <div className={styles.chatContainer} ref={mainContentRef}>
                    <div className={styles.contentWrapper}>
                        <div id="messages" className={styles.messages}>
                            {messages.map((msg, index) => (
                                <Message
                                    key={index}
                                    role={msg.role}
                                    text={msg.text}
                                    styles={styles}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {busyWaiting && (
                            <div className={styles.busyWaitContainer}>
                                <div className={styles.busyWait}></div>
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
                </div>{' '}
                <Modal isVisible={isModalVisible} styles={styles}>
                    {modalContent}
                </Modal>
            </main>
            <footer className={styles.footer}>
                &copy; 2025 Superexpert.AI
            </footer>
        </div>
    );
};

export default ChatBot;
