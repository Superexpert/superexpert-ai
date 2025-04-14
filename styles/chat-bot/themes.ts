'use client';
import { registerTheme } from '@superexpert-ai/framework';
import stylesDefault from '@/styles/chat-bot/default.module.css';
import { defaultPreview } from '@/styles/chat-bot/default-preview';
import stylesRed from '@/styles/chat-bot/red.module.css';
import stylesBlue from '@/styles/chat-bot/blue.module.css';

registerTheme({
    id: 'default',
    description: 'Default theme for the chat bot',
    name: 'Default Theme',
    imagePreview: defaultPreview,
    theme: stylesDefault,
});
registerTheme({
    id: 'red',
    description: 'Red theme for the chat bot',
    name: 'Red Theme',
    imagePreview: defaultPreview,
    theme: stylesRed,
});
registerTheme({
    id: 'blue',
    description: 'Blue theme for the chat bot',
    name: 'Blue Theme',
    imagePreview: defaultPreview,
    theme: stylesBlue,
});


