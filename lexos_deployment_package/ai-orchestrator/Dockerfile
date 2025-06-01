# syntax=docker/dockerfile:1

FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=0 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

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

# Set up a non-root user
RUN useradd -m aiuser

WORKDIR /app

# --- Builder stage ---
FROM base AS builder

# Copy requirements first for better cache utilization
COPY --link requirements.txt ./

# Create venv and install dependencies
RUN python3.10 -m venv /app/.venv \
    && . /app/.venv/bin/activate \
    && pip install --upgrade pip \
    && --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# Copy application source code
COPY --link src/ /app/src/
COPY --link config/ /app/config/

# --- Final stage ---
FROM base AS final

WORKDIR /app

# Copy venv from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code from builder
COPY --from=builder /app/src /app/src
COPY --from=builder /app/config /app/config

# Set environment variables for venv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH=/app

USER aiuser

CMD ["python3", "src/main.py"]
