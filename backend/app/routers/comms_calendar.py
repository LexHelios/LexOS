from fastapi import APIRouter
from ..services.calendar_service import create_event

router = APIRouter(prefix="/calendar")

@router.post("/create_event")
def calendar_create_event(summary: str, start_time: str, end_time: str):
    event = create_event(summary, start_time, end_time)
    return {"status": "created", "event": event} 