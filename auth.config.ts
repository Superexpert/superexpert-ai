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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (!isLoggedIn) {
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
  },
} satisfies NextAuthConfig;



// import type { NextAuthConfig } from 'next-auth';

// export const authConfig = {
//   pages: {
//     signIn: '/login',
//   },
//   providers: [
//     // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
//     // while this file is also used in non-Node.js environments
//   ],
//   callbacks: {
//     authorized({ auth, request: { nextUrl } }) {
//       const isLoggedIn = !!auth?.user;
//       const isOnDashboard = nextUrl.pathname.startsWith('/admin');
//       if (isOnDashboard) {
//         if (isLoggedIn) return true;
//         return false; // Redirect unauthenticated users to login page
//       } else if (isLoggedIn) {
//         console.log("!!!!! redirecting");
//         return Response.redirect(new URL('/admin', nextUrl));
//       }
//       return true;
//     },
//   },
// } satisfies NextAuthConfig;