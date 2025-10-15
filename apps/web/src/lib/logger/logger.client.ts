/**
 * Client-Side Logger
 *
 * Browser-compatible logger for client-side code.
 * The main logger.ts uses Node.js APIs that don't exist in browsers.
 *
 * Behavior:
 * - Development: Logs to browser console with appropriate levels
 * - Production: No-op (silent)
 *
 * Why not send to Axiom from browser?
 * - Would expose API token to browser (security risk)
 * - CORS issues
 * - Users could spam your logs
 *
 * Future Enhancement:
 * - Could send to /api/logs endpoint
 * - Could integrate with browser monitoring (Sentry, LogRocket, etc.)
 *
 * Usage:
 *   // Vite/bundler will use this file for client code
 *   import { logger } from '@/lib/logger/logger.server'
 *   logger.info('This works in browser')
 */

import type { Logger } from 'pino';

const isDevelopment = import.meta.env.DEV;

/**
 * Create log function for each level
 */
function createLogFunction(consoleMethod: (...args: unknown[]) => void) {
  return function (this: unknown, ...args: unknown[]) {
    if (!isDevelopment) return;

    // Handle Pino's signature: logger.info(obj, msg) or logger.info(msg)
    const [first, second] = args;

    if (typeof first === 'string') {
      // logger.info('message')
      consoleMethod(first);
    } else if (typeof first === 'object' && first !== null) {
      if (typeof second === 'string') {
        // logger.info({ context }, 'message')
        consoleMethod(second, first);
      } else {
        // logger.info({ context })
        consoleMethod(first);
      }
    }
  };
}

const noop = () => {};

export const logger: Logger = {
  // Log methods
  trace: isDevelopment ? createLogFunction(console.trace) : noop,
  debug: isDevelopment ? createLogFunction(console.log) : noop,
  info: isDevelopment ? createLogFunction(console.info) : noop,
  warn: isDevelopment ? createLogFunction(console.warn) : noop,
  error: isDevelopment ? createLogFunction(console.error) : noop,
  fatal: isDevelopment ? createLogFunction(console.error) : noop,

  // Silent method
  silent: noop,

  // Level management
  level: isDevelopment ? 'debug' : 'silent',
  isLevelEnabled: () => isDevelopment,
  levels: {
    values: {
      trace: 10,
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      fatal: 60,
    },
    labels: {
      10: 'trace',
      20: 'debug',
      30: 'info',
      40: 'warn',
      50: 'error',
      60: 'fatal',
    },
  },

  // Child logger (returns same stub)
  child: () => logger,

  // Bindings
  bindings: () => ({}),

  // Flush (no-op)
  flush: () => {},

  // Version
  version: '0.0.0-client',
} as unknown as Logger;

export type { Logger } from 'pino';
