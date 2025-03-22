import { registerClientTool, ClientToolsBase, Tool } from '@superexpert-ai/framework';
import { TextMessageConsentContent } from '@/forms/text-message-consent';

export class CustomClientTools extends ClientToolsBase {
    @Tool({
        name: 'showConsent',
        description: 'This is a tool to show a consent form',
    })
    public async showConsent() {
        const result = await this.clientContext.showModal(
            TextMessageConsentContent
        );
        return result;
    }
}

registerClientTool(CustomClientTools);
