# syntax=docker/dockerfile:1

# Three-stage Dockerfile for TanStack Start Application
# Optimized for layer caching and minimal production image size

# ============================================================================
# Stage 1: Dependencies - Install all dependencies
# This stage is cached until package files or source code changes
# ============================================================================
FROM oven/bun:1 AS dependencies

WORKDIR /usr/src/app

# Copy entire monorepo structure (respects .dockerignore)
COPY . .

# Install ALL dependencies including devDependencies (needed for build and Bun.serve)
RUN bun install --frozen-lockfile

# ============================================================================
# Stage 2: Build - Build the application
# ============================================================================
FROM oven/bun:1 AS build

WORKDIR /usr/src/app

# Copy everything from dependencies stage (source code + node_modules)
COPY --from=dependencies /usr/src/app ./

# Build the web application
WORKDIR /usr/src/app/apps/web
ARG DOTENV_PRIVATE_KEY_PRODUCTION
ENV DOTENV_PRIVATE_KEY_PRODUCTION=${DOTENV_PRIVATE_KEY_PRODUCTION}

# Verify DOTENV_PRIVATE_KEY_PRODUCTION is set
RUN if [ -z "$DOTENV_PRIVATE_KEY_PRODUCTION" ]; then \
  echo "ERROR: DOTENV_PRIVATE_KEY_PRODUCTION is not set or is empty" && \
  exit 1; \
  fi && \
  echo "✓ DOTENV_PRIVATE_KEY_PRODUCTION is set"

RUN bun run build

# ============================================================================
# Stage 3: Release - Create minimal production image
# ============================================================================
FROM oven/bun:1 AS release

WORKDIR /usr/src/app

# Copy node_modules from dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=dependencies /usr/src/app/apps/web/node_modules ./apps/web/node_modules
COPY --from=dependencies /usr/src/app/packages/db/node_modules ./packages/db/node_modules

# Copy built application from build stage
COPY --from=build /usr/src/app/apps/web/dist ./apps/web/dist

# Copy runtime files from build stage
COPY --from=build /usr/src/app/apps/web/server.ts ./apps/web/server.ts
COPY --from=build /usr/src/app/apps/web/package.json ./apps/web/package.json
COPY --from=build /usr/src/app/apps/web/docker-entrypoint.sh ./apps/web/docker-entrypoint.sh
COPY --from=build /usr/src/app/apps/web/.env.production ./apps/web/.env.production

# Copy workspace root package.json for workspace resolution
COPY --from=build /usr/src/app/package.json ./package.json

# Copy workspace packages (needed for @tjena/db and other workspace dependencies)
COPY --from=build /usr/src/app/packages ./packages

# Set working directory to the web app
WORKDIR /usr/src/app/apps/web

# Set production environment
ENV NODE_ENV=production
ENV PORT=3773

# Create data directory for SQLite database
RUN mkdir -p /data && chown -R bun:bun /data
RUN chmod +x docker-entrypoint.sh

# Run as non-root user for security
USER bun

# Expose the application port
EXPOSE 3773

# Start the application
ENTRYPOINT ["./docker-entrypoint.sh"]
