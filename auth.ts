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

        const db = new DBService();
        const user = await db.getUser(username as string);
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(password as string, user.password);
        if (passwordsMatch) {
          return { id: user.id, email: user.email };
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },


});