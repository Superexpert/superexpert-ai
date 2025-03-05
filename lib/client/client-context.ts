import { MessageAI } from '@/lib/message-ai';

export class ClientContext {
    constructor(
        public setTask: (taskName:string) => void,
        public getTask: () => void,
        public setThread: (id:string) => void,
        public getThread: () => void,
        public sendMessages: (messages:
            MessageAI[]) => Promise<void>,
        public showModal: () => void,
        public hideModal: () => void
    ) {}
}
    