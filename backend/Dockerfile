# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base

WORKDIR /app

# Builder stage: install dependencies in a venv
FROM base AS builder

# Install build dependencies (for packages that require compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt first for better cache usage
COPY --link requirements.txt ./

# Create venv and install dependencies using pip cache
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m venv .venv && \
    .venv/bin/pip install -r requirements.txt

# Copy the rest of the application code (excluding files via .dockerignore)
COPY --link . .

# Final stage: minimal runtime image
FROM base AS final

# Create a non-root user for security
RUN addgroup --system lexuser && adduser --system --ingroup lexuser lexuser

WORKDIR /app

# Copy venv and application code from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app /app

# Set environment so venv is used
ENV PATH="/app/.venv/bin:$PATH"

# Expose the default port
EXPOSE 8000

# Use non-root user
USER lexuser

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Entrypoint
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
