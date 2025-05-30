from twilio.rest import Client
import os

client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

def send_sms(to, message):
    return client.messages.create(
        body=message,
        from_=os.getenv("TWILIO_PHONE_NUMBER"),
        to=to
    )

def make_call(to, twiml_url):
    return client.calls.create(
        to=to,
        from_=os.getenv("TWILIO_PHONE_NUMBER"),
        url=twiml_url
    ) 