import { registerClientTool } from '@superexpert-ai/framework';
import { PaymentConsentContent } from '@/forms/payment-consent';

registerClientTool({
    name: 'showRobotPaymentConsent',
    category: 'sample',
    description: 'This is a tool to show a payment consent form for purchasing a robot',
    async function() {
        const result = await this.showModal(PaymentConsentContent);
        return result;
    },
});
