import { signOut, useSession } from '@/lib/auth-client';

/**
 * Header user component - shows user info or sign in button
 */
export default function HeaderUser() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!session) {
    return (
      <a href="/login" className="text-sm font-medium hover:underline">
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{session.user.name}</span>
      <button
        type="button"
        onClick={() => signOut()}
        className="text-sm text-muted-foreground hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}
