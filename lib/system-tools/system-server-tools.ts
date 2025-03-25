import { registerServerTool } from '@superexpert-ai/framework';

registerServerTool({
    name: 'getCurrentTime',
    category: 'system',
    description: 'Gets the current time including the time zone.',
    async function() {
        return `The current time is ${this.user.now.toLocaleString()} in the time zone ${
            this.user.timeZone
        }`;
    },
});

registerServerTool({
    name: 'updateProfile',
    category: 'system',
    description: `Update the user's profile`,
    parameters: [
        {
            name: 'name',
            type: 'string',
            description: 'The name of the profile property to update',
        },
        {
            name: 'value',
            type: 'string',
            description: 'The new value for the profile property',
        },
    ],
    async function(name, value) {
        // Update the user's profile in the database
        await this.db.profiles.upsert({
            where: {
                userId_agentId_name: {
                    userId: this.user.id,
                    agentId: this.agent.id,
                    name,
                },
            },
            update: {
                value,
            },
            create: {
                userId: this.user.id,
                agentId: this.agent.id,
                name,
                value,
            },
        });

        return `Successfully updated profile property ${name} to ${value}`;
    },
});
