from twilio.rest import Client
import os

client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

def send_whatsapp(to, message):
    return client.messages.create(
        body=message,
        from_=os.getenv("TWILIO_WHATSAPP_NUMBER"),
        to=f"whatsapp:{to}"
    ) 