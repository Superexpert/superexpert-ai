import stylesDefault from '@/styles/chat-bot/default.module.css';
import stylesRed from '@/styles/chat-bot/red.module.css';
import stylesBlue from '@/styles/chat-bot/blue.module.css';

type CSSModule = {
    readonly [key: string]: string;
};

type Theme = {
    id: string;
    name: string;
    theme: CSSModule;
};

export class Themes {
    public static themes: Theme[] = [];

    public static register(themes: Theme[]) {
        this.themes = themes;
    }

    public static getTheme(id: string): CSSModule {
        const theme = this.themes.find((theme) => theme.id === id)?.theme;
        if (!theme) {
            throw new Error(`Theme ${name} not found`);
        }
        return theme;
    }
}

Themes.register([
    { id: 'default', name: 'Default Theme', theme: stylesDefault },
    { id: 'red', name: 'Red Theme', theme: stylesRed },
    { id: 'blue', name: 'Blue Theme', theme: stylesBlue },
]);
