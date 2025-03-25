import { registerClientTool } from '@superexpert-ai/framework';
import { TextMessageConsentContent } from '@/forms/text-message-consent';



registerClientTool({
    name: 'showConsent',
    category: 'sample',
    description: 'This is a tool to show a consent form',
    async function() {
        const result = await this.showModal(
            TextMessageConsentContent
        );
        return result;
    },
 
});


