import styles from "./chat-bot.module.css";
import Markdown from "react-markdown";


export type MessageProps = {
    role: "user" | "assistant" | "tool" | "success" | "system";
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


const SuccessMessage = ({ src }: { src: string}) => {
    return (
        <div className={styles.assistantMessage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={'Success image'} />
        </div>
    );
}

export const Message = ({ role, text }: MessageProps) => {
    switch (role) {
        case "user":
            return <UserMessage text={text} />;
        case "assistant":
            return <AssistantMessage text={text} />;
        case "success":
            return <SuccessMessage src={text} />;  
        default:
            return null;
    }
};