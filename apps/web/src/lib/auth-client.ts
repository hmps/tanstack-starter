import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth client - use for auth operations in React components
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL ?? 'http://localhost:3010',
});

export const { useSession, signIn, signUp, signOut } = authClient;
