import { ClientToolsBase, Tool } from '@/lib/task-definition-types';


export class CustomClientTools extends ClientToolsBase {

    @Tool('showConsent', 'This is a tool to show a consent modal')
    public async showConsent() {
        console.log('showConsent is awesome');
    }

}
