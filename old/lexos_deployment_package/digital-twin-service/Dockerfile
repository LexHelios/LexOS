# syntax=docker/dockerfile:1

FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3.10-venv \
    python3-pip \
    git \
    curl \
    wget \
    unzip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create a non-root user
RUN useradd -m --uid 1001 appuser

# --- Builder stage ---
FROM base AS builder

# Copy requirements.txt first for better cache utilization
COPY --link requirements.txt ./

# Create virtual environment and install dependencies
RUN --mount=type=cache,target=/root/.cache/pip \
    python3.10 -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install -r requirements.txt

# Copy application code and config
COPY --link src/ /app/src/
COPY --link config/ /app/config/

# Create directories for model storage and data
RUN mkdir -p /app/models /app/data

# --- Final stage ---
FROM base AS final

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code and config from builder
COPY --from=builder /app/src /app/src
COPY --from=builder /app/config /app/config
COPY --from=builder /app/models /app/models
COPY --from=builder /app/data /app/data

# Set environment to use venv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app

# Set permissions and switch to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose default port
EXPOSE 8000

# Run the service
CMD ["python", "src/main.py"]
