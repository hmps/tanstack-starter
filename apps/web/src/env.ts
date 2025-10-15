import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

export const env = createEnv({
  server: {
    CLERK_WEBHOOK_SECRET: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    // Axiom logging (required in production, optional in development)
    AXIOM_DATASET: isProduction
      ? z.string().min(1, 'AXIOM_DATASET is required in production')
      : z.string().optional(),
    AXIOM_TOKEN: isProduction
      ? z.string().min(1, 'AXIOM_TOKEN is required in production')
      : z.string().optional(),
  },
  clientPrefix: 'VITE_',
  client: {
    VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: { ...process.env, ...import.meta.env },
  emptyStringAsUndefined: true,
});
