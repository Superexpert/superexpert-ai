import { registerServerTool } from '@superexpert-ai/framework';
import { prisma } from '@/lib/db/prisma';


registerServerTool({
    name: 'getWeather',
    description: 'Get the weather for the specified location',
    parameters: [
        {
            name: 'location',
            type: 'string',
            description: 'location to get the weather',
        },
        {
            name: 'unit',
            type: 'string',
            description: 'location to get the weather',
            enum: ['celsius', 'fahrenheit'],
            required: false,
        },
 
    ],
    function(location: string, unit: 'celsius' | 'fahrenheit' = 'celsius') {
        const weatherData = {
            "london" : "foggy",
            "la" : "sunny",
            "seattle" : "rainy",
            "austin" : "hot",
            "helena" : "snowy",
        };
        const weather = weatherData[location.toLowerCase() as keyof typeof weatherData] || "miserable";
        return `The weather in ${location} is ${weather} and the unit is ${unit}.`;
    },
});


registerServerTool({
    name: 'remember',
    description: 'Remember something for a duration of time',
    parameters: [
        {
            name: 'content',
            type: 'string',
            description: 'The something to remember',
        },
        {
            name: 'duration',
            type: 'string',
            description: 'The duration for which to remember the content. Defaults to "day" if not specified.',
            enum: ['day', 'week', 'month', 'quarter', 'year', 'forever'],
            required: false,
            default: 'day',
        },
 
    ],
    async function(content: string, duration: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'forever' = 'day') {
        const expiresInDays = {
            day: 1,
            week: 7,
            month: 30,
            quarter: 90,
            year: 365,
            forever: 365 * 100, // Arbitrary large number for "forever"
        }[duration];

        console.log(`User ${this.user.id} wants to remember "${content}" for ${duration} (${expiresInDays} days) for agent ${this.agent.id}`);

        await prisma.memories.create({
            data: {
                userId: this.user.id,
                agentId: this.agent.id,
                content: content,
                expiresInDays: expiresInDays,
            },
        });
        return `User ${this.user.id}: I will remember "${content}" for ${duration}.`;
    },
});



