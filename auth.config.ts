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
            console.log('Rufus 1: Start of authorized');
            // Allow access to the register page without a logged-in session.
            if (request.nextUrl.pathname === '/register') {
                console.log('Rufus 2', "register path");

                return true;
            }

            const isLoggedIn = !!auth?.user;
            console.log('Rufus 3', isLoggedIn);

            return isLoggedIn;
        },
    },
} satisfies NextAuthConfig;
