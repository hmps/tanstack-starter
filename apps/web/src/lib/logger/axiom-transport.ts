/**
 * Custom Pino Transport for Axiom
 *
 * This transport sends logs to Axiom via their REST API.
 * It implements batching for efficiency and graceful error handling.
 *
 * Why custom transport instead of @axiomhq/pino?
 * - The official package has Vite bundling issues (can't find .cjs files)
 * - See ADR 001 for full rationale: ../../../../.agents/decisions/adr-001-pino-axiom-logging.md
 *
 * Environment variables:
 * - AXIOM_DATASET: The dataset name to send logs to
 * - AXIOM_TOKEN: Your Axiom API token (xaat-...)
 * - AXIOM_BATCH_SIZE: Max logs per batch (default: 100)
 * - AXIOM_FLUSH_INTERVAL: Flush interval in ms (default: 5000)
 */

import build from 'pino-abstract-transport';

interface AxiomConfig {
  dataset: string;
  token: string;
  batchSize: number;
  flushInterval: number;
  apiUrl: string;
}

interface LogEntry {
  level: number;
  time: number;
  pid: number;
  hostname: string;
  msg?: string;
  [key: string]: unknown;
}

/**
 * Get configuration from environment variables
 */
function getConfig(): AxiomConfig {
  const dataset = process.env.AXIOM_DATASET;
  const token = process.env.AXIOM_TOKEN;

  if (!dataset || !token) {
    throw new Error(
      'AXIOM_DATASET and AXIOM_TOKEN environment variables are required for Axiom transport',
    );
  }

  return {
    dataset,
    token,
    batchSize: Number(process.env.AXIOM_BATCH_SIZE) || 100,
    flushInterval: Number(process.env.AXIOM_FLUSH_INTERVAL) || 5000, // 5 seconds
    apiUrl: process.env.AXIOM_API_URL || 'https://api.axiom.co',
  };
}

/**
 * Send batch of logs to Axiom
 */
async function sendBatch(logs: LogEntry[], config: AxiomConfig): Promise<void> {
  if (logs.length === 0) return;

  const url = `${config.apiUrl}/v1/datasets/${config.dataset}/ingest`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logs),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `[Axiom Transport] Failed to send logs: ${response.status} ${response.statusText}`,
        text,
      );
    }
  } catch (error) {
    console.error('[Axiom Transport] Error sending logs to Axiom:', error);
  }
}

/**
 * Pino abstract transport for Axiom
 */
export default async function axiomTransport() {
  const config = getConfig();

  let batch: LogEntry[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Flush current batch to Axiom
   */
  const flush = async () => {
    if (batch.length === 0) return;

    const logsToSend = [...batch];
    batch = [];

    await sendBatch(logsToSend, config);

    // Clear timer if it exists
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };

  /**
   * Schedule a flush
   */
  const scheduleFLush = () => {
    if (flushTimer) return;

    flushTimer = setTimeout(() => {
      flush().catch((err) => {
        console.error('[Axiom Transport] Flush error:', err);
      });
    }, config.flushInterval);
  };

  return build(
    async (source) => {
      source.on('data', (obj: LogEntry) => {
        // Add log to batch
        batch.push(obj);

        // If batch is full, flush immediately
        if (batch.length >= config.batchSize) {
          flush().catch((err) => {
            console.error('[Axiom Transport] Flush error:', err);
          });
        } else {
          // Otherwise schedule a flush
          scheduleFLush();
        }
      });

      // Ensure we flush on close
      source.on('end', async () => {
        if (flushTimer) {
          clearTimeout(flushTimer);
        }
        await flush();
      });
    },
    {
      async close() {
        if (flushTimer) {
          clearTimeout(flushTimer);
        }
        await flush();
      },
    },
  );
}
