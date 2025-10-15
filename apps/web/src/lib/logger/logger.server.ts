/**
 * Application Logger (Server-Only)
 *
 * This file uses the .server.ts extension to ensure it's only imported on the server.
 * TanStack Start will automatically exclude this from client bundles.
 *
 * Unified logging solution using Pino with environment-aware transports:
 * - Development: Pretty console output + file logging
 * - Production: Structured JSON logs to Axiom
 *
 * Why Pino?
 * - Fastest Node.js logger
 * - Structured logging (JSON)
 * - Worker-based transports (non-blocking)
 * - Excellent TypeScript support
 *
 * Why Axiom transport?
 * - Using official @axiomhq/pino package
 * - See ADR: ../../../../.agents/decisions/adr-001-pino-axiom-logging.md
 *
 * Usage:
 *   import { logger } from '@/lib/logger/logger.server'
 *
 *   logger.info({ userId: 123 }, 'User logged in')
 *   logger.error({ err, orderId: 456 }, 'Payment failed')
 *   logger.debug({ query: 'SELECT...' }, 'Database query')
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Logger } from 'pino';
import pino from 'pino';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '.logs');
const LOG_FILE = path.join(LOG_DIR, 'dev.log');

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Ensure logs directory exists in development
 */
function ensureLogDir() {
  if (isDevelopment && !fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Create transport configuration based on environment
 */
function createTransport() {
  if (isDevelopment) {
    // Development: Pretty console + file
    return pino.transport({
      targets: [
        {
          target: 'pino-pretty',
          level: process.env.PINO_LOG_LEVEL || 'debug',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
        {
          target: 'pino/file',
          level: process.env.PINO_LOG_LEVEL || 'debug',
          options: {
            destination: LOG_FILE,
            mkdir: true,
          },
        },
      ],
    });
  }

  if (isProduction) {
    // Production: Axiom via official @axiomhq/pino package
    const hasAxiomConfig = process.env.AXIOM_DATASET && process.env.AXIOM_TOKEN;

    if (!hasAxiomConfig) {
      console.warn(
        '[Logger] AXIOM_DATASET and AXIOM_TOKEN not set. Logs will only go to console.',
      );
      // Fallback to console in production if Axiom not configured
      return pino.transport({
        target: 'pino/file',
        level: process.env.PINO_LOG_LEVEL || 'info',
        options: {
          destination: 1, // stdout
        },
      });
    }

    return pino.transport({
      target: '@axiomhq/pino',
      level: process.env.PINO_LOG_LEVEL || 'info',
      options: {
        dataset: process.env.AXIOM_DATASET,
        token: process.env.AXIOM_TOKEN,
      },
    });
  }

  // Default fallback (shouldn't happen, but safe)
  return pino.transport({
    target: 'pino-pretty',
    level: process.env.PINO_LOG_LEVEL || 'info',
  });
}

/**
 * Create and configure logger
 */
function createLogger(): Logger {
  ensureLogDir();

  const transport = createTransport();

  const logger = pino(
    {
      level: process.env.PINO_LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      // Add base context
      base: {
        pid: process.pid,
        hostname: process.env.HOSTNAME || 'unknown',
        env: process.env.NODE_ENV || 'development',
      },
      // Timestamp in ISO format
      timestamp: pino.stdTimeFunctions.isoTime,
      // Redact sensitive fields (add more as needed)
      redact: {
        paths: [
          'password',
          'token',
          'apiKey',
          'secret',
          'authorization',
          '*.password',
          '*.token',
          '*.apiKey',
          '*.secret',
        ],
        censor: '[REDACTED]',
      },
      // Error serialization
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
      },
    },
    transport,
  );

  return logger;
}

/**
 * Singleton logger instance
 */
export const logger = createLogger();

/**
 * Graceful shutdown: flush logs before exit
 */
function setupGracefulShutdown() {
  const shutdown = async () => {
    logger.info('Flushing logs before shutdown...');
    // Pino transports handle flushing automatically
    // Give them a moment to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  process.on('exit', () => {
    shutdown().catch((err) => {
      console.error('Error flushing logs:', err);
    });
  });

  process.on('SIGINT', () => {
    shutdown()
      .catch((err) => {
        console.error('Error flushing logs:', err);
      })
      .finally(() => {
        process.exit(0);
      });
  });

  process.on('SIGTERM', () => {
    shutdown()
      .catch((err) => {
        console.error('Error flushing logs:', err);
      })
      .finally(() => {
        process.exit(0);
      });
  });
}

setupGracefulShutdown();

// Export types for convenience
export type { Logger } from 'pino';
