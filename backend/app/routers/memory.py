from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..services.memory_service import get_db, store_memory, retrieve_memories
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter(prefix="/memory")

class MemoryCreate(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

class MemoryResponse(BaseModel):
    id: int
    timestamp: str
    content: str
    metadata: Optional[Dict[str, Any]] = None

@router.post("/store", response_model=MemoryResponse)
def store_memory_endpoint(memory: MemoryCreate, db: Session = Depends(get_db)):
    stored_memory = store_memory(memory.content, memory.metadata)
    return MemoryResponse(
        id=stored_memory.id,
        timestamp=stored_memory.timestamp.isoformat(),
        content=stored_memory.content,
        metadata=stored_memory.metadata
    )

@router.get("/retrieve", response_model=list[MemoryResponse])
def retrieve_memories_endpoint(limit: int = 10, db: Session = Depends(get_db)):
    memories = retrieve_memories(limit)
    return [
        MemoryResponse(
            id=memory.id,
            timestamp=memory.timestamp.isoformat(),
            content=memory.content,
            metadata=memory.metadata
        )
        for memory in memories
    ] 