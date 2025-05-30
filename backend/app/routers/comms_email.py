from fastapi import APIRouter
from ..services.email_service import send_email

router = APIRouter(prefix="/email")

@router.post("/send")
def email_send(to: str, subject: str, body: str):
    send_email(to, subject, body)
    return {"status": "sent"}

@router.get("/receive")
def email_receive():
    # TODO: Implement IMAP email receiving
    return {"status": "not_implemented"} 