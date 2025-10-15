#!/bin/sh
set -e

echo "Running database migrations..."
bun run dotenvx run -f .env.production -- sh -c "cd /usr/src/app/packages/db && echo \$DATABASE_PATH && bun run --bun migrate.ts"

cd /usr/src/app/apps/web

echo "Starting application..."
bun start
