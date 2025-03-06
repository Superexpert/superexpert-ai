import { ClientToolsBase, Tool } from '@/lib/task-definition-types';

export class CustomClientTools extends ClientToolsBase {
    @Tool('showAgreement', 'This is a tool to show a contract agreement')
    public async showAgreement() {
        console.log('showAgreement is awesome');
        this.clientContext.showModal('This is a contract agreement');
    }
}
