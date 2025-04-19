import { registerContextTool } from "@superexpert-ai/framework";


registerContextTool({
    name: 'loadProfile', 
    category: 'system',
    description: 'Load the user profile.',
    async function() {
        // Load the current user's profile from the database
        const profile = await this.db.profiles.findMany({
            where: {
                userId: this.user.id,
            },
        });

        // Convert the profile to a JSON object
        const profileJson = profile.reduce(
            (acc: { [key: string]: string }, curr) => {
                acc[curr.name] = curr.value;
                return acc;
            },
            {}
        );

        return `User Profile: ${JSON.stringify(profileJson, null, 2)}`;
    },
});