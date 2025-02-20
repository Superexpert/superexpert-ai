'use client';
import { useState } from "react";
import { authenticateAction } from '@/lib/server/server-actions';
import { useSearchParams } from 'next/navigation';
import { useForm } from "react-hook-form";
import { RegisterUser, registerUserSchema } from '@/lib/register-user';
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/navigation';




export default function LoginForm() {
  const [serverError, setServerError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
  });
  
   
  const onSubmit = async (registerUser: RegisterUser) => {
    const result = await authenticateAction(registerUser, callbackUrl);
    if (result.success) {
      router.push(callbackUrl);
    } else {
      setServerError(result.serverError);
    }
  };
  
  return (
    <div className="formCard">
      <h1>Log In</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          {serverError && <p className="error">{serverError}</p>}
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input
            {...register("email")} 
            type="email"
            placeholder="Enter your email address"
          />
          {errors.email && <p className="error">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            {...register("password")} 
            type="password"
            placeholder="Enter password"
          />
          {errors.password && <p className="error">{errors.password.message}</p>}
        </div>
        <button className="btn btnPrimary">Log in </button>
      </form>
      <div className="mt-4">
        Don't have an account? <a href="/register">Register</a>
      </div>
    </div>
  );
}


// 'use client';

// import { useActionState } from 'react';
// import { authenticate } from '@/lib/server/server-actions';
// import { useSearchParams } from 'next/navigation';

// export default function LoginForm() {
//   const searchParams = useSearchParams();
//   const callbackUrl = searchParams.get('callbackUrl') || '/';
//   const [errorMessage, formAction, isPending] = useActionState(
//     authenticate,
//     undefined,
//   );

//   return (
//     <form action={formAction} className="space-y-3">
//       <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
//         <h1 className={"mb-3 text-2xl"}>
//           Please log in to continue.
//         </h1>
//         <div className="w-full">
//           <div>
//             <label
//               className="mb-3 mt-5 block text-xs font-medium text-gray-900"
//               htmlFor="email"
//             >
//               Email
//             </label>
//             <div className="relative">
//               <input
//                 className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
//                 id="email"
//                 type="email"
//                 name="email"
//                 placeholder="Enter your email address"
//                 required
//               />
//             </div>
//           </div>
//           <div className="mt-4">
//             <label
//               className="mb-3 mt-5 block text-xs font-medium text-gray-900"
//               htmlFor="password"
//             >
//               Password
//             </label>
//             <div className="relative">
//               <input
//                 className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
//                 id="password"
//                 type="password"
//                 name="password"
//                 placeholder="Enter password"
//                 required
//                 minLength={6}
//               />
//             </div>
//           </div>
//         </div>
//         <input type="hidden" name="redirectTo" value={callbackUrl} />
//         <button className="mt-4 w-full" aria-disabled={isPending}>
//           Log in 
//         </button>
//         <div
//           className="flex h-8 items-end space-x-1"
//           aria-live="polite"
//           aria-atomic="true"
//         >
//           {errorMessage && (
//             <>
//               <p className="text-sm text-red-500">{errorMessage}</p>
//             </>
//           )}
//         </div>
//       </div>
//     </form>
//   );
// }