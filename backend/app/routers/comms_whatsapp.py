from fastapi import APIRouter
from ..services.whatsapp_service import send_whatsapp

router = APIRouter(prefix="/whatsapp")

@router.post("/send")
def whatsapp_send(to: str, message: str):
    return send_whatsapp(to, message) 