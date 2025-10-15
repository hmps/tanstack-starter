# Database Package - Agent Guide

## ID Conventions

All primary keys in the database use **nanoid-based IDs with entity-specific prefixes**.

### Format
- **Pattern**: `{prefix}_{nanoid}`
- **Length**: 26 characters total (prefix + underscore + 21-char nanoid)
- **Characters**: URL-safe (A-Za-z0-9_-)

### Implementation

All schemas use the `nanoid` package with the following pattern:

`prefix_${nanoid()}`

### Why This Format?

1. **Human-readable**: The prefix makes it immediately clear what type of entity the ID references
2. **URL-safe**: Can be safely used in URLs without encoding
3. **Short**: 26 characters vs 36 for UUIDs
4. **Collision-resistant**: nanoid provides strong uniqueness guarantees
5. **Debuggable**: Easy to spot which entity an ID belongs to in logs and database queries

### Adding New Entities

When creating new database tables, follow this convention:
1. Choose a short, descriptive prefix (3-5 characters)
2. Use the `text` column type
3. Set as primary key
4. Use `.$defaultFn(() => \`prefix_${nanoid()}\`)` for automatic generation

## Running Migrations

**CRITICAL: Only use the Bun script to run migrations.**

### The ONLY Correct Way

```bash
bun run db:migrate
```

### What NOT to Do

❌ **DO NOT** run `drizzle-kit migrate` directly
❌ **DO NOT** run `bun run drizzle-kit migrate`
❌ **DO NOT** apply SQL files manually with sqlite3

### Workflow

1. Make schema changes in `src/schema/*.ts`
2. Generate migration: `bun run drizzle-kit generate`
3. Apply migration: `bun run db:migrate` ← **Always use this!**
