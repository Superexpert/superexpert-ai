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
