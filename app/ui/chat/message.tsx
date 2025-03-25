import styles from '@/styles/chat-bot/default.module.css';
import Markdown from 'react-markdown';

export type MessageProps = {
    role: 'user' | 'assistant' | 'tool' | 'system';
    text: string;
};

const UserMessage = ({ text }: { text: string }) => {
    return <div className={styles.userMessage}>{text}</div>;
};

const AssistantMessage = ({ text }: { text: string }) => {
    return (
        <div className={styles.assistantMessage}>
            <Markdown>{text}</Markdown>
        </div>
    );
};


export const Message = ({ role, text }: MessageProps) => {
    switch (role) {
        case 'user':
            return <UserMessage text={text} />;
        case 'assistant':
            return <AssistantMessage text={text} />;
        default:
            return null;
    }
};
