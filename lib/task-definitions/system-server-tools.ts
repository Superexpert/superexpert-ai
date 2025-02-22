import {
    ServerToolsBase,
    Tool,
    ToolParameter,
} from '@/lib/task-definition-types';

export class SystemServerTools extends ServerToolsBase {
    @Tool('getCurrentTime', 'Get the current time')
    public async getCurrentTime() {
        return new Date().toISOString();
    }

    @Tool('updateProfile', `Update the user's profile`)
    public async updateProfile(
        @ToolParameter('name', 'The name of the profile property to update')
        name: string,
        @ToolParameter('value', 'The new value for the profile property')
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
