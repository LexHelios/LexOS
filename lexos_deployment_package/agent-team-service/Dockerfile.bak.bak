# syntax=docker/dockerfile:1

# --- Base image with CUDA runtime and system dependencies ---
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
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    libsndfile1 \
    libportaudio2 \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# --- Builder stage: install Python dependencies in a venv ---
FROM base AS builder
WORKDIR /app

# Copy requirements.txt only (for better cache usage)
COPY --link requirements.txt ./

# Create venv and install dependencies using pip cache
RUN python3.10 -m venv .venv \
    && .venv/bin/pip install --upgrade pip \
    && --mount=type=cache,target=/root/.cache/pip \
       .venv/bin/pip install -r requirements.txt

# --- Final stage: copy app and venv, set up non-root user ---
FROM base AS final
WORKDIR /app

# Create a non-root user
RUN useradd -m agentuser

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application source and config (using --link for efficiency)
COPY --link src/ ./src/
COPY --link config/ ./config/

# Create directories for data and models
RUN mkdir -p /app/data /app/models && chown -R agentuser:agentuser /app

# Set environment for venv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app

# Switch to non-root user
USER agentuser

# Expose the default FastAPI port
EXPOSE 8000

# Run the service
CMD ["python", "src/main.py"]
