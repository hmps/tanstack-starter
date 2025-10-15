# ADR 001: Pino Logger with Axiom Integration

**Status:** Accepted
**Date:** 2024-01-15
**Decision Makers:** Development Team
**Tags:** logging, observability, infrastructure

## Context

Our TanStack Start application (SSR with Vite + Bun) previously used a custom logger implementation for development that wrote to local files. We needed to add production logging capabilities with cloud-based log aggregation via Axiom.co while maintaining the development experience.

### Requirements
1. Structured logging in JSON format for production
2. Human-readable logs for development
3. Push logs to Axiom.co in production
4. Work with Vite's SSR bundling
5. Support both server-side and client-side code paths
6. Minimal performance overhead

### Technical Constraints
- **Vite Bundling**: Vite uses ESM and has specific module resolution behavior
- **SSR Environment**: Code runs on both server and client
- **Bun Runtime**: Production server uses Bun (Node.js compatible)
- **TanStack Start**: Meta-framework with specific build pipeline

## Decision

We will implement logging using **Pino** with a **custom HTTP transport** for Axiom instead of the official `@axiomhq/pino` package.

### Architecture

```
Development:
  Pino → pino-pretty (console) + pino/file (./.logs/dev.log)

Production:
  Pino → Custom HTTP Transport → Axiom REST API

Client-side:
  Import stub → No-op logger (prevents bundling issues)
```

## Rationale

### 1. Why Pino?

**Chosen over:** Winston, Bunyan, custom implementation

**Reasons:**
- **Performance**: Pino is the fastest Node.js logger (low overhead, async by default)
- **Structured Logging**: Native JSON output, perfect for log aggregation
- **Transport System**: Built-in transport workers run in separate threads
- **Ecosystem**: Large ecosystem with many transports and tools
- **TypeScript Support**: Excellent type definitions
- **Production Ready**: Used by major companies and frameworks

### 2. Why Custom HTTP Transport Instead of `@axiomhq/pino`?

**Problem with `@axiomhq/pino`:**
```
Error: unable to determine transport target for "@axiomhq/pino"
```

This is a [known issue](https://github.com/pinojs/pino/issues/1964) when using Vite:
- The package expects `.cjs` files in the build output
- Vite generates `.mjs` files by default
- The module resolution fails during production build
- Tree-shaking and bundling cause the transport to not be found

**Our Solution:**
Implement a custom Pino transport that:
- Uses direct HTTP POST to Axiom's REST API
- Batches logs for efficiency
- Lives in our codebase (no external package resolution issues)
- Full control over retry logic, error handling, and batching

**Trade-offs:**
- ✅ **Pro**: No Vite bundling issues
- ✅ **Pro**: Complete control over batching and retry logic
- ✅ **Pro**: Simpler debugging (code is in our repo)
- ✅ **Pro**: Works reliably with Vite + Bun
- ⚠️ **Con**: More code to maintain (~150 lines)
- ⚠️ **Con**: Need to update if Axiom API changes (rare)

### 3. Why Separate Vite Logger from App Logger?

The custom Vite logger in `vite.config.ts` serves a different purpose:
- **Vite Logger**: Build-time logs (HMR, compilation, dev server)
- **App Logger**: Runtime application logs (business logic, errors, metrics)

Keeping them separate:
- ✅ Cleaner separation of concerns
- ✅ Different log destinations (build logs vs app logs)
- ✅ Different formats (Vite needs specific interface)
- ✅ Vite logger stays fast (file-based, no network)

### 4. Why Environment-Based Transport Switching?

**Development:**
```typescript
targets: [
  { target: 'pino-pretty', options: { colorize: true } },
  { target: 'pino/file', options: { destination: './.logs/dev.log' } }
]
```

**Production:**
```typescript
target: './src/lib/axiom-transport.ts'
```

**Rationale:**
- Dev: Readable console output + local file for debugging
- Prod: Structured JSON to cloud (no local files needed)
- No cost for Axiom API calls during development
- Faster development (no network latency)

### 5. Why Client-Side Stub?

**Problem:**
- Pino uses Node.js APIs (`fs`, `process`, etc.)
- Client bundles don't have these APIs
- Import errors break the app

**Solution:**
Create `logger.client.ts` with no-op implementations:
```typescript
export const logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  // ...
}
```

**Benefits:**
- ✅ Same import path in all code
- ✅ No runtime errors in browser
- ✅ Can be enhanced later (send to browser logging service)
- ✅ Prevents accidental server code in client bundle

## Alternatives Considered

### Alternative 1: Use Winston
- ❌ Slower than Pino
- ❌ Less modern architecture (no worker threads)
- ✅ More familiar to some developers
- **Verdict**: Performance matters for logging

### Alternative 2: Keep Custom Logger + Add Axiom SDK
- ❌ More code to maintain
- ❌ Reinventing the wheel
- ❌ Missing features (log levels, structured logging, etc.)
- **Verdict**: Use battle-tested library

### Alternative 3: Use `@axiomhq/pino` Despite Issues
- ❌ Doesn't work with Vite (build errors)
- ❌ Workarounds are hacky and brittle
- ✅ Official package (better updates?)
- **Verdict**: Can't use something that doesn't build

### Alternative 4: Send Logs Client-Side via Fetch
- ❌ Exposes Axiom token to browser
- ❌ CORS issues
- ❌ Users can spam your logs
- ✅ No server-side code needed
- **Verdict**: Security risk

### Alternative 5: Use console.log + Cloud Function Scraper
- ❌ Not structured
- ❌ Extra infrastructure
- ❌ Delayed logs
- ✅ Very simple
- **Verdict**: Not production-ready

## Implementation Details

### File Structure
```
apps/web/
├── logger.ts           # Main logger (Pino with env-based transport)
├── logger.client.ts    # Browser stub
├── axiom-transport.ts  # Custom Axiom HTTP transport
└── .logs/
    └── dev.log         # Development logs (gitignored)
```

### Environment Variables
```bash
# Required in production
AXIOM_DATASET=your-dataset-name
AXIOM_TOKEN=xaat-your-token-here

# Optional
NODE_ENV=production|development
PINO_LOG_LEVEL=info|debug|warn|error
```

### Usage Examples

**Server-side code:**
```typescript
import { logger } from './logger'

logger.info({ userId: 123, action: 'login' }, 'User logged in')
logger.error({ err, userId: 123 }, 'Payment failed')
```

**Client-side code:**
```typescript
// Automatically uses stub in browser
import { logger } from './logger'

logger.info('This is a no-op in browser')
```

## Consequences

### Positive
- ✅ Production-ready logging to Axiom
- ✅ Excellent development experience (pretty logs + files)
- ✅ Works reliably with Vite + Bun
- ✅ High performance (Pino is fastest)
- ✅ Structured logging for better observability
- ✅ Type-safe logger interface

### Negative
- ⚠️ Custom transport code to maintain (~150 lines)
- ⚠️ Need to monitor Axiom API changes
- ⚠️ Developers need to learn Pino API (minor)

### Neutral
- 📝 Need to configure environment variables for production
- 📝 Logs directory added to gitignore
- 📝 Slightly more complex logger.ts than before

## Maintenance & Monitoring

### What to Watch
1. **Axiom API changes**: Subscribe to Axiom changelog
2. **Pino updates**: Follow semver, test before upgrading
3. **Log volume**: Monitor Axiom usage to avoid surprise bills
4. **Transport errors**: Add alerting if logs fail to send

### When to Revisit
- If `@axiomhq/pino` fixes Vite compatibility (check annually)
- If log volume becomes too high (optimize batching)
- If we need browser-side logging (enhance client stub)
- If we switch away from Vite (transport may work then)

## References

- [Pino Documentation](https://getpino.io/)
- [Axiom API Documentation](https://axiom.co/docs/restapi/ingest)
- [Pino GitHub Issue #1964 - Vite bundling problem](https://github.com/pinojs/pino/issues/1964)
- [Axiom Pino Guide](https://axiom.co/docs/guides/pino)
- [TanStack Start Documentation](https://tanstack.com/start)

## Approval

**Approved by:** Development Team
**Date:** 2024-01-15

---

*This ADR follows the format: Context → Decision → Consequences*
