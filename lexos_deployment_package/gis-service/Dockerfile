# syntax=docker/dockerfile:1

FROM python:3.10-slim AS base

# Set environment variables for non-interactive installs and python behavior
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install system dependencies required for GIS libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev=3.6.2* \
    gdal-data=3.6.2* \
    python3-gdal=3.6.2* \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user to run the app
RUN useradd -m gisuser

WORKDIR /app

FROM base AS builder

# Copy only requirements.txt first for better cache usage
COPY --link requirements.txt ./

# Create venv and install dependencies using pip cache
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install -r requirements.txt

# Copy the rest of the application code
COPY --link . .

FROM base AS final

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv
# Copy application code from builder
COPY --from=builder /app /app

# Set environment variables for the app
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH=/app \
    PORT=8003

# Use the non-root user
USER gisuser

EXPOSE 8003

# Entrypoint: run with gunicorn and uvicorn worker
CMD ["gunicorn", "src.main:app", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8003"]
