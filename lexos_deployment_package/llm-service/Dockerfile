# syntax=docker/dockerfile:1

# --- Base image with CUDA runtime and Python ---
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# --- Builder stage: install system deps, create venv, install Python deps ---
FROM base AS builder

WORKDIR /app

# Install system dependencies in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3.10-venv \
    python3-pip \
    git \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python3.10 -m venv /app/.venv

# Upgrade pip inside venv (optional, but not required by guidelines)
# RUN /app/.venv/bin/pip install --upgrade pip

# Copy requirements.txt using --link for build cache efficiency
COPY --link requirements.txt ./

# Install Python dependencies into venv, using pip cache
RUN --mount=type=cache,target=/root/.cache/pip \
    /app/.venv/bin/pip install -r requirements.txt

# --- Final stage: minimal runtime image ---
FROM base AS final

WORKDIR /app

# Create non-root user
RUN useradd -m llmuser

# Copy venv from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code and config using --link
COPY --link src/ /app/src/
COPY --link config/ /app/config/

# Create models directory (for model cache/storage)
RUN mkdir -p /app/models && chown -R llmuser:llmuser /app/models

# Set environment variables for venv and python path
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app

# Switch to non-root user
USER llmuser

# Expose port (optional, for FastAPI default)
EXPOSE 8000

# Run the service
CMD ["python", "src/main.py"]
