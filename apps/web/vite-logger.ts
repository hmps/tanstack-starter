/**
 * Vite Custom Logger (Build-time only)
 *
 * This logger is ONLY for Vite's build/dev server output.
 * It's separate from the application logger (src/lib/logger/logger.server.ts).
 *
 * Why separate?
 * - Vite logger: Build output, HMR, compilation (development only)
 * - App logger: Business logic, API calls, errors (dev + production)
 *
 * See ADR: ./.agents/decisions/adr-001-pino-axiom-logging.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Logger, LogLevel } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '.logs');
const LOG_FILE = path.join(LOG_DIR, 'vite.log');

// Queue for async log writing
let writeQueue: string[] = [];
let isWriting = false;

// Ensure logs directory exists and clear log file on start
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  // Clear the log file on server start
  try {
    fs.writeFileSync(LOG_FILE, '', 'utf-8');
  } catch (error) {
    console.error('Failed to clear Vite log file:', error);
  }
}

// Non-blocking file write using queue
async function flushLogs() {
  if (isWriting || writeQueue.length === 0) return;

  isWriting = true;
  const logsToWrite = [...writeQueue];
  writeQueue = [];

  try {
    const content = logsToWrite.join('');
    await fs.promises.appendFile(LOG_FILE, content, 'utf-8');
  } catch (error) {
    console.error('Failed to write Vite logs:', error);
  } finally {
    isWriting = false;
    if (writeQueue.length > 0) {
      setImmediate(() => flushLogs());
    }
  }
}

// Strip ANSI color codes from strings
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  // biome-ignore lint/suspicious/noControlCharactersInRegex: we need this
  return str.replace(/\u001b\[[0-9;]*m/g, '');
}

// Queue a log entry for writing
function queueLog(message: string) {
  writeQueue.push(message);
  setImmediate(() => flushLogs());
}

// Format log message with timestamp
function formatLog(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  const cleanMessage = stripAnsi(message);
  return `[${timestamp}] [${level.toUpperCase()}] ${cleanMessage}\n`;
}

// Create custom logger for Vite that writes to console and file
export function createViteLogger(): Logger {
  ensureLogDir();

  const logger: Logger = {
    info(msg: string) {
      const logEntry = formatLog('info', msg);
      console.info(msg);
      queueLog(logEntry);
    },

    warn(msg: string) {
      const logEntry = formatLog('warn', msg);
      console.warn(msg);
      queueLog(logEntry);
    },

    error(msg: string, options?: { error?: Error; timestamp?: boolean }) {
      const errorMsg = options?.error ? `${msg}\n${options.error.stack}` : msg;
      const logEntry = formatLog('error', errorMsg);
      console.error(msg);
      if (options?.error) console.error(options.error);
      queueLog(logEntry);
    },

    clearScreen(_type: string) {
      console.clear();
    },

    hasErrorLogged(_error: Error | RollupError) {
      return false;
    },

    hasWarned: false,
    warnOnce(msg: string) {
      if (!this.hasWarned) {
        this.hasWarned = true;
        this.warn(msg);
      }
    },
  };

  return logger;
}

// Cleanup function to flush remaining logs before exit
export function flushLogsSync() {
  if (writeQueue.length > 0) {
    try {
      const content = writeQueue.join('');
      fs.appendFileSync(LOG_FILE, content, 'utf-8');
      writeQueue = [];
    } catch (error) {
      console.error('Failed to flush Vite logs on exit:', error);
    }
  }
}

// Handle process exit to flush remaining logs
process.on('exit', flushLogsSync);
process.on('SIGINT', () => {
  flushLogsSync();
  process.exit(0);
});
process.on('SIGTERM', () => {
  flushLogsSync();
  process.exit(0);
});

// RollupError type for compatibility
interface RollupError extends Error {
  code?: string;
  frame?: string;
  plugin?: string;
  pluginCode?: string;
  id?: string;
  hook?: string;
  watchFiles?: string[];
}
