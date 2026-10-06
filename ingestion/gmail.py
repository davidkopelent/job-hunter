import base64
from datetime import datetime, timezone
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from ingestion.models import Email

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

BASE_DIR = Path(__file__).resolve().parent.parent
CREDENTIALS_FILE = BASE_DIR / "credentials.json"
TOKEN_FILE = BASE_DIR / "token.json"


def get_gmail_service():
    credentials = None

    if TOKEN_FILE.exists():
        credentials = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            credentials = flow.run_local_server(port=0)

        TOKEN_FILE.write_text(credentials.to_json())

    return build("gmail", "v1", credentials=credentials)


def fetch_emails(service, query: str, mime_type: str, after: datetime) -> list[Email]:
    """Return every email matching the Gmail search `query` received after `after`."""
    messages = service.users().messages()
    query = f"{query} after:{int(after.timestamp())}"

    message_ids = []
    page_token = None
    while True:
        response = messages.list(userId="me", q=query, pageToken=page_token).execute()
        message_ids += [message["id"] for message in response.get("messages", [])]
        page_token = response.get("nextPageToken")
        if not page_token:
            break

    emails = []
    for message_id in message_ids:
        message = messages.get(userId="me", id=message_id).execute()
        emails.append(
            Email(
                received_at=datetime.fromtimestamp(int(message["internalDate"]) / 1000, timezone.utc),
                body=get_body(message["payload"], mime_type),
            )
        )

    return emails


def get_body(payload, mime_type: str) -> str:
    if payload["mimeType"] == mime_type:
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode()

    for part in payload.get("parts", []):
        body = get_body(part, mime_type)
        if body:
            return body

    return ""
