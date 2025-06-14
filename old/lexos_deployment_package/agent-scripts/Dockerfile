# syntax=docker/dockerfile:1

FROM python:3.10-slim AS base

# Set environment variables for Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_CACHE_DIR=/root/.cache/pip

# Create a non-root user for security
RUN useradd -m lexosuser

WORKDIR /app

# --- Builder stage ---
FROM base AS builder

# Install build dependencies (for native extensions, e.g. numpy, librosa, etc.)
RUN apt-get update --allow-releaseinfo-change && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libsndfile1 \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt first for better cache utilization
COPY --link requirements.txt ./

# Create virtual environment and install dependencies using pip cache
RUN python -m venv /app/.venv \
    && . /app/.venv/bin/activate \
    && --mount=type=cache,target=/root/.cache/pip pip install --upgrade pip \
    && --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# Copy the rest of the application code (excluding .git, .env, etc. via .dockerignore)
COPY --link . .

# --- Final stage ---
FROM base AS final

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code from builder
COPY --from=builder /app /app

# Set PATH to use the virtual environment
ENV PATH="/app/.venv/bin:$PATH"

# Switch to non-root user
USER lexosuser

EXPOSE 8009

# Default command: run the FastAPI app with Gunicorn/Uvicorn worker
CMD ["gunicorn", "src.main:app", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8009"]
