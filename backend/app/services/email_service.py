import smtplib
from email.mime.text import MIMEText
import os

def send_email(to, subject, body):
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = os.getenv("EMAIL_ADDRESS")
    msg["To"] = to

    with smtplib.SMTP_SSL(os.getenv("EMAIL_SMTP_SERVER"), 465) as server:
        server.login(os.getenv("EMAIL_ADDRESS"), os.getenv("EMAIL_PASSWORD"))
        server.sendmail(msg["From"], [msg["To"]], msg.as_string()) 