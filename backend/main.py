# /opt/lexcommand/backend/main.py

import os
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import jwt
import redis.asyncio as redis
from typing import Optional
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis connection
@asynccontextmanager
async def get_redis():
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        password=os.getenv("REDIS_PASSWORD", None),
        decode_responses=True,
        ssl=os.getenv("REDIS_SSL", "false").lower() == "true"
    )
    try:
        yield redis_client
    finally:
        await redis_client.close()

# App init
app = FastAPI(
    title="LexCommand API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Security
security = HTTPBearer()

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to LexCommand API"}

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting up LexCommand API")