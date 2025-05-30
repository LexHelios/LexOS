# syntax=docker/dockerfile:1

FROM python:3.10-slim AS base

# Set up a non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Set working directory
WORKDIR /app

FROM base AS builder

# Install system dependencies needed for build and runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt using bind mount for better cache usage
COPY --link requirements.txt ./

# Create virtual environment and install dependencies using pip cache
RUN python -m venv .venv \
    && .venv/bin/pip install --upgrade pip \
    && --mount=type=cache,target=/root/.cache/pip \
       .venv/bin/pip install -r requirements.txt

# Copy application code (excluding .env, .git, etc. via .dockerignore)
COPY --link . .

FROM base AS final

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv
# Copy application code from builder
COPY --from=builder /app /app

# Set environment so the venv is used
ENV PATH="/app/.venv/bin:$PATH"
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose the application port
EXPOSE 3000

# Switch to non-root user
USER appuser

# Start the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
