# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1

# Build stage
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

# Install dependencies (use npm ci for deterministic builds)
COPY --link package.json package.json
COPY --link package-lock.json package-lock.json
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the application source
COPY --link . .

# Build the production-ready static files
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Production stage
FROM node:${NODE_VERSION}-slim AS final
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy built app and production dependencies from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

USER appuser

# Expose the port the app runs on (React default is 3000, but for static build, use a static server)
EXPOSE 3000

# Use a minimal static file server for production (e.g., serve or http-server)
# Install 'serve' globally
RUN npm install -g serve@14.2.0

# Start the static server
CMD ["serve", "-s", "build", "-l", "3000"]
