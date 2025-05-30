from googleapiclient.discovery import build
from google.oauth2 import service_account
import os

def get_calendar_service():
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    creds = service_account.Credentials.from_service_account_file(
        os.getenv("GOOGLE_CREDENTIALS_FILE"), scopes=SCOPES)
    return build('calendar', 'v3', credentials=creds)

def create_event(summary, start_time, end_time):
    service = get_calendar_service()
    event = {
        'summary': summary,
        'start': {'dateTime': start_time, 'timeZone': 'UTC'},
        'end': {'dateTime': end_time, 'timeZone': 'UTC'},
    }
    return service.events().insert(calendarId='primary', body=event).execute() 