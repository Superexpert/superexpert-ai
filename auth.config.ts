import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    providers: [
        // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
        // while this file is also used in non-Node.js environments
    ],
    callbacks: {
        authorized({
            auth,
            request,
        }: {
            auth: any;
            request: { nextUrl: URL };
        }) {
            // Allow access to the register page without a logged-in session.
            if (request.nextUrl.pathname === '/register') {
                return true;
            }
            const isLoggedIn = !!auth?.user;
            return isLoggedIn;
        },
    },
} satisfies NextAuthConfig;
