# ==============================================================================
# Transformation OS — Multi-stage Docker Build
# Produces a single container running both Hono API and Next.js Web for Cloud Run
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base image with pnpm
# ------------------------------------------------------------------------------
FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ------------------------------------------------------------------------------
# Stage 2: Install ALL dependencies (dev + prod) for building
# Cached on package.json changes only
# ------------------------------------------------------------------------------
FROM base AS deps

# Build tools needed for argon2 native compilation
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace config and all package.json files (for layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/db/package.json packages/db/tsconfig.json ./packages/db/
COPY packages/api/package.json packages/api/tsconfig.json ./packages/api/
COPY packages/web/package.json packages/web/tsconfig.json ./packages/web/

RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 3: Build all packages
# ------------------------------------------------------------------------------
FROM deps AS builder

WORKDIR /app

# Copy all source code and build scripts
COPY packages/ ./packages/
COPY scripts/ ./scripts/

# Build-time environment for Next.js
# Empty NEXT_PUBLIC_API_URL = relative URLs (proxied via rewrites in Docker)
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_TELEMETRY_DISABLED=1

# Build in dependency order: shared → db → api → web
RUN pnpm --filter @tr/shared build && \
    pnpm --filter @tr/db build && \
    pnpm --filter @tr/api build && \
    pnpm --filter @tr/web build

# ------------------------------------------------------------------------------
# Stage 4: Production-only dependencies
# Separate stage so we don't include devDependencies in the final image
# ------------------------------------------------------------------------------
FROM base AS prod-deps

# Build tools needed for argon2 native compilation
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Use hoisted node_modules (flat, npm-style) so packages are resolvable at runtime
# without pnpm's symlink structure (which breaks on Docker COPY)
RUN echo "shamefully-hoist=true" > .npmrc

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/

RUN pnpm install --frozen-lockfile --prod

# ------------------------------------------------------------------------------
# Stage 5: Production runner (minimal image)
# ------------------------------------------------------------------------------
FROM node:20-slim AS runner

# dumb-init for proper PID 1 signal handling; curl for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 1) Copy Next.js standalone output (creates base directory structure + server.js)
COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static ./packages/web/.next/static

# 2) Copy built workspace packages
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json

COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/package.json ./packages/api/package.json

# 3) Copy production node_modules (third-party deps with compiled argon2)
#    This overwrites the standalone's node_modules with the full prod superset
COPY --from=prod-deps /app/node_modules ./node_modules

# 4) Fix workspace package resolution
#    pnpm symlinks get dereferenced during Docker COPY (pointing to empty dirs).
#    Replace them with symlinks to our actual built packages.
RUN rm -rf node_modules/@tr && \
    mkdir -p node_modules/@tr && \
    ln -s ../../packages/shared node_modules/@tr/shared && \
    ln -s ../../packages/db node_modules/@tr/db

# 5) Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Cloud Run sets PORT env var (default 8080)
EXPOSE 8080

# Use dumb-init for proper signal handling (SIGTERM from Cloud Run)
ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
