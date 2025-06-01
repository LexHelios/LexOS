# syntax=docker/dockerfile:1

FROM python:3.10-slim AS base

# Set working directory
WORKDIR /app

# Builder stage: install dependencies in a venv
FROM base AS builder

# Copy requirements.txt first for better cache utilization
COPY --link requirements.txt ./

# Create venv and install dependencies using pip cache
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m venv .venv && \
    .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install -r requirements.txt

# Copy the rest of the application code
COPY --link . .

# Final stage: copy only what is needed
FROM base AS final

# Create a non-root user
RUN useradd -m visionuser

WORKDIR /app

# Copy venv and app code from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app /app

# Set environment so venv is used
ENV PATH="/app/.venv/bin:$PATH"

# Expose the service port
EXPOSE 8007

USER visionuser

CMD ["gunicorn", "src.main:app", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8007"]
