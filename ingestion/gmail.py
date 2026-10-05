from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from ingestion.parsers.linkedin import parse_jobs

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

BASE_DIR = Path(__file__).resolve().parent.parent
CREDENTIALS_FILE = BASE_DIR / "credentials.json"
TOKEN_FILE = BASE_DIR / "token.json"

def get_gmail_service():
    credentials = None

    if TOKEN_FILE.exists():
        credentials = Credentials.from_authorized_user_file(
            TOKEN_FILE,
            SCOPES,
        )

    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE,
                SCOPES,
            )
            credentials = flow.run_local_server(port=0)

        TOKEN_FILE.write_text(credentials.to_json())

    return build("gmail", "v1", credentials=credentials)

def get_messages(service):
    response = (
        service.users()
        .messages()
        .list(
            userId="me",
            q="from:(jobs-noreply@linkedin.com)",
            maxResults=20,
        )
        .execute()
    )

    return response.get("messages", [])

import base64

def get_message_details(service, message_id):
    return (
        service.users()
        .messages()
        .get(
            userId="me",
            id=message_id,
            format="full",
        )
        .execute()
    )

def get_body(payload):
    if payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(
            payload["body"]["data"]
        ).decode("utf-8", errors="replace")

    for part in payload.get("parts", []):
        body = get_body(part)
        if body:
            return body

    return ""

if __name__ == "__main__":
    service = get_gmail_service()
    messages = get_messages(service)

    print(f"Found {len(messages)} LinkedIn messages\n")

    for message in messages:
        details = get_message_details(service, message["id"])
        body = get_body(details["payload"])

        jobs = parse_jobs(body)

        print("\n" + "=" * 80)
        print(f"EMAIL {message['id']}")
        print("=" * 80)
        print(f"Found {len(jobs)} jobs")

        for job in jobs:
            print(
                f"  {job.title} | "
                f"{job.company} | "
                f"{job.location} | "
                f"{job.source_id}"
            )
