'use client';
import { handleSignOut } from '@/lib/actions/server-actions';
export default function SignOutButton() {
  return (
    <form action={handleSignOut}>
      <button className="btnSecondary">
        Sign out
      </button>
    </form>
  );
}

// import { signOut } from '@/auth';

// const SignOutButton = async () => {
//     return (
//         <form
//         className="m-0 p-0"
//             action={async () => {
//                 'use server';
//                 await signOut({ redirectTo: '/login' });
//             }}>
//             <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
//                 Sign Out
//             </button>
//         </form>
//     );
// };

// export default SignOutButton;
