# syntax=docker/dockerfile:1

FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
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
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create a non-root user
RUN useradd -m oracleuser

FROM base AS builder

WORKDIR /app

# Copy requirements file with --link for build cache efficiency
COPY --link requirements.txt ./

# Create virtual environment and install dependencies using pip cache
RUN --mount=type=cache,target=/root/.cache/pip \
    python3.10 -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install -r requirements.txt

# Copy application source and config (with --link)
COPY --link src/ /app/src/
COPY --link config/ /app/config/

# Create directories for data and models
RUN mkdir -p /app/data /app/models

FROM base AS final

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code and config from builder
COPY --from=builder /app/src /app/src
COPY --from=builder /app/config /app/config
COPY --from=builder /app/data /app/data
COPY --from=builder /app/models /app/models

# Set environment for venv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app

# Set user to non-root
USER oracleuser

# Expose port (FastAPI default)
EXPOSE 8000

# Run the service
CMD ["python3", "src/main.py"]
