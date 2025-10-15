#!/bin/sh
set -e

echo "Running database migrations..."
cd /usr/src/app/packages/db
bun run --bun migrate.ts
cd /usr/src/app/apps/web
echo "Starting application..."
bun start
