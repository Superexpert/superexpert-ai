import { ClientToolsBase, Tool } from '@/lib/task-definition-types';
import { TextMessageConsentContent } from '@/forms/text-message-consent';

export class CustomClientTools extends ClientToolsBase {
    @Tool('showConsent', 'This is a tool to show a consent form')
    public async showConsent() {
        const result = await this.clientContext.showModal(
            TextMessageConsentContent
        );
        return result;
    }
}
