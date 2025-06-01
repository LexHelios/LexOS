# syntax=docker/dockerfile:1

FROM python:3.10-slim AS base

# Set working directory
WORKDIR /app

# Builder stage: install dependencies in a venv
FROM base AS builder

# Copy requirements.txt first for better cache utilization
COPY --link requirements.txt ./

# Create venv and install dependencies using pip cache
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install -r requirements.txt

# Copy application code (excluding .env, .git, etc. via .dockerignore)
COPY --link . .

# Final stage: minimal image with venv and app code, non-root user
FROM base AS final

# Create a non-root user and group
RUN addgroup --system appuser && adduser --system --ingroup appuser appuser

# Copy venv and app code from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app /app

# Set environment to use venv
ENV PATH="/app/.venv/bin:$PATH"

# Switch to non-root user
USER appuser

# Expose the service port
EXPOSE 8006

# Default command
CMD ["gunicorn", "src.main:app", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8006"]
