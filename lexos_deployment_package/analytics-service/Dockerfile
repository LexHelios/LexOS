# syntax=docker/dockerfile:1

FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_CACHE_DIR=/root/.cache/pip

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3.10-venv \
    python3-pip \
    git \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# --- Builder stage ---
FROM base AS builder

# Copy requirements.txt first for better cache utilization
COPY --link requirements.txt ./

# Create virtual environment and install dependencies
RUN --mount=type=cache,target=/root/.cache/pip \
    python3.10 -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install -r requirements.txt

# Copy application source code and config
COPY --link src/ ./src/
COPY --link config/ ./config/

# --- Final stage ---
FROM base AS final

# Create a non-root user
RUN useradd -m --uid 1001 appuser

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv
# Copy application code and config from builder
COPY --from=builder /app/src /app/src
COPY --from=builder /app/config /app/config

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app

USER appuser

# Expose the default FastAPI port (8000) and Prometheus metrics port (9090)
EXPOSE 8000 9090

CMD ["python3", "src/main.py"]
