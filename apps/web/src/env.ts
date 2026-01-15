import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url().optional(),
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
    VITE_BETTER_AUTH_URL: z.string().url().optional(),
  },
  runtimeEnv: { ...process.env, ...import.meta.env },
  emptyStringAsUndefined: true,
});
