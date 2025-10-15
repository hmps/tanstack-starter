# Logging Guide

This guide explains how to use the application logger in your TanStack Start application.

## Quick Start

```typescript
import { logger } from '@/lib/logger/logger.server'

// Simple log
logger.info('User logged in')

// Log with context
logger.info({ userId: 123, action: 'login' }, 'User logged in')

// Log errors
logger.error({ err, orderId: 456 }, 'Payment failed')

// Different log levels
logger.debug('Debugging info')
logger.warn('Warning message')
logger.fatal('Critical error')
```

## Server-Only Convention

The main logger file uses the `.server.ts` extension (`logger.server.ts`). This is a TanStack Start convention that ensures the file is **only imported and bundled for server-side code**.

**Why `.server.ts`?**
- ✅ Prevents accidental imports in client code
- ✅ TanStack Start automatically excludes these files from client bundles
- ✅ Node.js APIs (like `fs`, `process`) are safe to use
- ✅ No runtime errors from missing browser APIs

**How it works:**
```typescript
// In server code (routes, loaders, server functions)
import { logger } from '@/lib/logger/logger.server'
logger.info('This runs on the server') // ✅ Works perfectly

// In client code
import { logger } from '@/lib/logger/logger.server'
logger.info('Component rendered') // ⚠️ Build error or runtime error
```

**For client-side logging:**
Use `logger.client.ts` (development console) or integrate a browser monitoring service like Sentry.

## Environment Setup

### Development
No configuration needed! Logs automatically go to:
- ✅ Pretty console output (colored, human-readable)
- ✅ File: `./.logs/dev.log` (for debugging)

### Production
Set these environment variables:

```bash
# Required
AXIOM_DATASET=your-dataset-name
AXIOM_TOKEN=xaat-your-token-here
NODE_ENV=production

# Optional
PINO_LOG_LEVEL=info              # trace|debug|info|warn|error|fatal
AXIOM_BATCH_SIZE=100             # Logs per batch
AXIOM_FLUSH_INTERVAL=5000        # Milliseconds
```

Get your Axiom credentials:
1. Go to [Axiom Dashboard](https://app.axiom.co/)
2. Create a dataset (or use existing)
3. Create API token with **Ingest** permission

## Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `trace` | Very detailed debugging | `logger.trace({ query }, 'DB query')` |
| `debug` | Development debugging | `logger.debug({ state }, 'State changed')` |
| `info` | General information | `logger.info({ userId }, 'User login')` |
| `warn` | Warning, but not error | `logger.warn({ limit }, 'Rate limit warning')` |
| `error` | Errors that need attention | `logger.error({ err }, 'Payment failed')` |
| `fatal` | Critical errors (app crash) | `logger.fatal({ err }, 'Database connection lost')` |

## Best Practices

### ✅ DO: Use Structured Logging

```typescript
// Good - structured data
logger.info({
  userId: 123,
  action: 'purchase',
  amount: 99.99
}, 'User made purchase')

// Bad - string interpolation
logger.info(`User ${userId} made purchase of ${amount}`)
```

**Why?** Structured logs are searchable in Axiom:
```
userId == 123 AND action == "purchase"
```

### ✅ DO: Log Errors Properly

```typescript
try {
  await processPayment()
} catch (err) {
  logger.error({
    err,              // Pino serializes full error with stack trace
    userId,
    orderId,
    amount
  }, 'Payment processing failed')
}
```

### ✅ DO: Add Context with Child Loggers

```typescript
// Create child logger with context
const requestLogger = logger.child({ requestId: req.id, userId: req.user.id })

requestLogger.info('Processing request')
requestLogger.debug({ query }, 'Database query')
requestLogger.info('Request completed')

// All logs will include requestId and userId
```

### ✅ DO: Use Log Levels Appropriately

```typescript
// Development debugging - use debug
logger.debug({ state }, 'Component rendered')

// Important business events - use info
logger.info({ userId, orderId }, 'Order created')

// Problems that need attention - use error
logger.error({ err }, 'Failed to send email')
```

### ❌ DON'T: Log Sensitive Data

```typescript
// Bad - logs password!
logger.info({ email, password }, 'User logging in')

// Good - password is automatically redacted
logger.info({ email }, 'User logging in')
```

**Auto-redacted fields:**
- `password`
- `token`
- `apiKey`
- `secret`
- `authorization`

### ❌ DON'T: Log Too Much in Production

```typescript
// Bad - creates noise in production
logger.debug({ data }, 'Processing item')  // Called 10,000 times

// Good - log summaries
logger.info({ processedCount: 10000, duration }, 'Batch processing complete')
```

### ✅ DO: Use logger in Client Code (Development)

```typescript
// Client logger automatically uses console in development
import { logger } from '@/lib/logger/logger.server'

function MyComponent() {
  logger.info('Component rendered')  // Logs to console in dev
  logger.warn({ userId: 123 }, 'Rate limit approaching')
  logger.error({ err }, 'API call failed')
}
```

**Note:** In production, client logs are silent (no-op) for security and performance.

## Server vs Client

### Server-Side (✅ Full Logging)
```typescript
// In API routes, server functions, etc.
import { logger } from '@/lib/logger/logger.server'

export async function POST(req: Request) {
  logger.info({ endpoint: '/api/users' }, 'API call')
  // Development: console + file
  // Production: Axiom
}
```

### Client-Side (✅ Console in Dev, Silent in Prod)
```typescript
// In browser components
import { logger } from '@/lib/logger/logger.server'

function MyComponent() {
  logger.info('Component rendered')
  logger.warn({ userId: 123 }, 'Rate limit warning')
  logger.error({ err }, 'Failed to fetch data')
}
```

**Behavior:**
- **Development**: Logs to browser console with appropriate levels
  - `logger.info()` → `console.info()`
  - `logger.warn()` → `console.warn()`
  - `logger.error()` → `console.error()`
  - `logger.debug()` → `console.debug()`

- **Production**: Silent (no-op)
  - All log calls do nothing
  - No performance overhead
  - No accidental data leaks

**Why not send to Axiom from browser?**
- Would expose API token to browser (security risk)
- CORS issues with Axiom API
- Users could spam your logs
- Client-side errors should use dedicated tools (Sentry, LogRocket, etc.)

## Common Patterns

### API Request Logging
```typescript
export async function GET(req: Request) {
  const start = Date.now()
  const requestId = crypto.randomUUID()
  const log = logger.child({ requestId })

  log.info({ method: 'GET', path: req.url }, 'Request started')

  try {
    const result = await handler()
    log.info({ duration: Date.now() - start }, 'Request completed')
    return result
  } catch (err) {
    log.error({ err, duration: Date.now() - start }, 'Request failed')
    throw err
  }
}
```

### Background Job Logging
```typescript
async function processQueue() {
  const jobLogger = logger.child({ job: 'queue-processor' })

  jobLogger.info('Starting queue processing')

  const items = await getQueueItems()
  jobLogger.info({ count: items.length }, 'Fetched queue items')

  for (const item of items) {
    try {
      await processItem(item)
      jobLogger.debug({ itemId: item.id }, 'Processed item')
    } catch (err) {
      jobLogger.error({ err, itemId: item.id }, 'Failed to process item')
    }
  }

  jobLogger.info('Queue processing complete')
}
```

### Database Query Logging
```typescript
async function queryDatabase(sql: string, params: unknown[]) {
  const start = Date.now()

  logger.debug({ sql, params }, 'Executing query')

  try {
    const result = await db.query(sql, params)
    logger.debug({
      duration: Date.now() - start,
      rowCount: result.rows.length
    }, 'Query completed')
    return result
  } catch (err) {
    logger.error({
      err,
      sql,
      duration: Date.now() - start
    }, 'Query failed')
    throw err
  }
}
```

## Troubleshooting

### Logs not appearing in Axiom?

1. **Check environment variables:**
   ```bash
   echo $AXIOM_DATASET
   echo $AXIOM_TOKEN
   echo $NODE_ENV
   ```

2. **Check token permissions:**
   - Token needs **Ingest** permission
   - Token must be for the correct dataset

3. **Check network:**
   ```bash
   curl -H "Authorization: Bearer $AXIOM_TOKEN" \
        https://api.axiom.co/v1/datasets/$AXIOM_DATASET
   ```

4. **Check logs for errors:**
   - Look for `[Axiom Transport]` errors in console
   - Check `./.logs/dev.log` in development

### Logger not working in tests?

```typescript
// Mock logger in tests
vi.mock('@/lib/logger/logger.server', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    // ... other methods
  }
}))
```

### Too many logs / high costs?

1. **Increase log level in production:**
   ```bash
   PINO_LOG_LEVEL=warn  # Only warn, error, fatal
   ```

2. **Sample logs:**
   ```typescript
   // Log only 10% of requests
   if (Math.random() < 0.1) {
     logger.info({ path }, 'Request')
   }
   ```

3. **Use Axiom's sampling:**
   - Configure in Axiom dashboard
   - Keeps representative sample

## Architecture

For detailed architectural decisions and rationale, see:
- [ADR 001: Pino + Axiom Logging](./adr-001-pino-axiom-logging.md)

## Files

```
apps/web/
├── src/
│   └── lib/
│       └── logger/
│           ├── logger.server.ts       # Main logger (server-only)
│           ├── logger.client.ts       # Client logger (console in dev, silent in prod)
├── vite-logger.ts                     # Vite build logger (separate from app logger)
├── .env.example                       # Environment variable template
└── .logs/
    ├── dev.log                        # App logs (development)
    └── vite.log                       # Vite build logs (development)
```

## Support

- [Pino Documentation](https://getpino.io/)
- [Axiom Documentation](https://axiom.co/docs)
- [Axiom APL Query Language](https://axiom.co/docs/apl/introduction)
