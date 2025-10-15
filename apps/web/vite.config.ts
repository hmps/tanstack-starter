import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { createViteLogger } from './vite-logger';

const isDevelopment = process.env.NODE_ENV === 'development';
const port = process.env.PORT ? Number(process.env.PORT) : 3010;

const config = defineConfig({
  server: {
    port,
  },
  // Only use custom Vite logger in development mode
  // Note: This is separate from the app logger (src/lib/logger/logger.server.ts)
  customLogger: isDevelopment ? createViteLogger() : undefined,
  // disabled to let dotenvx handle the env vars
  envDir: false,
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
