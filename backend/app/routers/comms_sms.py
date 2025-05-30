from fastapi import APIRouter
from ..services.sms_service import send_sms, make_call

router = APIRouter(prefix="/sms")

@router.post("/send")
def sms_send(to: str, message: str):
    return send_sms(to, message)

@router.post("/call")
def call_user(to: str):
    twiml_url = "https://handler.twilio.com/twiml/XXXXXXXX"
    return make_call(to, twiml_url) 