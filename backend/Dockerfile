# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base

# Set environment variables for pip cache
ENV PIP_CACHE_DIR=/root/.cache/pip

# Create a non-root user
RUN addgroup --system lexos && adduser --system --ingroup lexos lexos

# Set workdir
WORKDIR /app

# --- Builder stage ---
FROM base AS builder

# Copy requirements.txt first for better cache utilization
COPY --link requirements.txt ./

# Create virtual environment and install dependencies using pip cache
RUN --mount=type=cache,target=$PIP_CACHE_DIR \
    python -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install -r requirements.txt

# Copy the rest of the application code
COPY --link . .

# --- Final stage ---
FROM base AS final

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code from builder
COPY --from=builder /app /app

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/data && \
    chown -R lexos:lexos /app

# Switch to non-root user
USER lexos

# Expose port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
