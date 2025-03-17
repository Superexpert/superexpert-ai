import {
    ServerToolsBase,
    Tool,
    ToolParameter,
} from '@/lib/task-definition-types';

export class SystemServerTools extends ServerToolsBase {
    @Tool({
        name: 'getCurrentTime',
        description: 'Gets the current time including the time zone.',
    })
    public async getCurrentTime() {
        return `The current time is ${this.user.now.toLocaleString()} in the time zone ${
            this.user.timeZone
        }`;
    }

    @Tool({ name: 'updateProfile', description: `Update the user's profile` })
    public async updateProfile(
        @ToolParameter({
            name: 'name',
            description: 'The name of the profile property to update',
        })
        name: string,
        @ToolParameter({
            name: 'value',
            description: 'The new value for the profile property',
        })
        value: string
    ) {
        // Update the user's profile in the database
        await this.db.profiles.upsert({
            where: {
                userId_name: {
                    userId: this.user.id,
                    name,
                },
            },
            update: {
                value,
            },
            create: {
                userId: this.user.id,
                name,
                value,
            },
        });

        return `Successfully updated profile property ${name} to ${value}`;
    }
}
