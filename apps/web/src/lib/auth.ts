import { db } from '@myapp/db';
import * as schema from '@myapp/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
// import { tanstackStartCookies } from 'better-auth/tanstack-start';

/**
 * Better Auth server instance - handles all authentication logic
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  // plugins: [tanstackStartCookies()],
});

export type Session = typeof auth.$Infer.Session;
