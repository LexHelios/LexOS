# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1

# Build stage
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

# Install dependencies (use npm ci for deterministic builds)
COPY --link package.json ./
COPY --link package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source files
COPY --link . .

# Build the TypeScript app (runs tsc and vite build)
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# Remove dev dependencies and install only production dependencies
RUN --mount=type=cache,target=/root/.npm \
    rm -rf node_modules && npm ci --production

# Production stage
FROM node:${NODE_VERSION}-slim AS final
WORKDIR /app

# Create non-root user
RUN addgroup --system lexos && adduser --system --ingroup lexos lexos
USER lexos

# Copy built app and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

EXPOSE 3000

CMD ["node", "dist/index.js"]
