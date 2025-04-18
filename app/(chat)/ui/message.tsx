import Markdown from 'react-markdown';

export type MessageProps = {
    role: 'user' | 'assistant';
    text: string;
    styles?: Record<string, string>
};


export const Message = ({ role, text, styles = {} }: MessageProps) => {
    return (
        <div className={role === 'user' ? styles.userMessage : styles.assistantMessage}>
            {role === 'assistant' ? <Markdown>{text}</Markdown> : text}
        </div>
    );
};

