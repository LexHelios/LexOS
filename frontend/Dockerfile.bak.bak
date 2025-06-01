# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1

###########################
# Build Stage
###########################
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

# Install build dependencies only
COPY --link package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the app source
COPY --link . .

# Build the app (Vite + TypeScript)
RUN npm run build

###########################
# Production Stage
###########################
FROM nginx:alpine AS runtime

# Create non-root user
RUN addgroup -S lexos && adduser -S lexos -G lexos

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY --link nginx.conf /etc/nginx/conf.d/default.conf

# Set permissions for non-root user
RUN chown -R lexos:lexos /usr/share/nginx/html

USER lexos

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
