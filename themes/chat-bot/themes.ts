'use client';
import { registerTheme } from '@superexpert-ai/framework';
import stylesDefault from '@/themes/chat-bot/default.module.css';
import { defaultPreview } from '@/themes/chat-bot/default-preview';
import stylesModern from '@/themes/chat-bot/modern.module.css';
import stylesBlue from '@/themes/chat-bot/blue.module.css';

registerTheme({
    id: 'default',
    description: 'Generous and friendly white-space designed for a professional audience.',
    name: 'Default Theme',
    imagePreview: '/themes/default/default-preview.png',
    theme: stylesDefault,
});
registerTheme({
    id: 'modern',
    description: 'Distinctive and modern theme with a gray background.',
    name: 'Modern Theme',
    imagePreview: '/themes/modern/modern-preview.png',
    theme: stylesModern,
});
registerTheme({
    id: 'blue',
    description: 'Blue theme with chat input fixed at the bottom of the screen.',
    name: 'Blue Theme',
    imagePreview: '/themes/blue/blue-preview.png',
    theme: stylesBlue,
});


