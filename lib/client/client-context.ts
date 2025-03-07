import { ReactElement } from 'react';
import { MessageAI } from '@/lib/message-ai';
import { ClientTaskDefinition } from './client-task-definition';

export type ShowModalType = (
    ContentComponent: (props: {
        onSubmit: (result: string) => void;
    }) => ReactElement
) => void;

export class ClientContext {
    constructor(
        public tasks: ClientTaskDefinition[],
        public getCurrentTask: () => ClientTaskDefinition,
        public getTask: (taskName: string) => ClientTaskDefinition | null,
        public setTask: (taskName: string) => void,
        public getCurrentThread: () => string,
        public setThread: (id: string) => void,
        public sendMessages: (messages: MessageAI[]) => Promise<void>,
        public showModal: ShowModalType,
        public hideModal: () => void
    ) {}
}
