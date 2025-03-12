import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import { DBService } from '@/lib/db/db-service';

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            // Returning null fails authorization
            async authorize(credentials) {
                const { username, password } = credentials;
                console.log('Elmo 1');

                const db = new DBService();
                const user = await db.getUser(username as string);
                if (!user) return null;

                console.log('Elmo 2');


                const passwordsMatch = await bcrypt.compare(
                    password as string,
                    user.password
                );
                if (passwordsMatch) {
                console.log('Elmo 3');

                    return { id: user.id, email: user.email };
                }

                return null;
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            console.log('Ralph 1');

            if (user) {
            console.log('Ralph 2');

                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            console.log('Ann 1');

            if (token && session.user) {
            console.log('Ann 2');

                session.user.id = token.id as string;
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
    },
});
