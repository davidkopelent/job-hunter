"""Gmail over IMAP with an app password. Searches use Gmail's own query syntax (X-GM-RAW)."""

import email
import email.policy
import imaplib
import os
import re
from datetime import datetime

from dotenv import load_dotenv

from ingestion.models import Email

load_dotenv()


def connect() -> imaplib.IMAP4_SSL:
    """Log in and open All Mail read-only. Use as `with connect() as mailbox:` to log out afterwards."""
    mailbox = imaplib.IMAP4_SSL("imap.gmail.com")
    mailbox.login(os.environ["GMAIL_ADDRESS"], os.environ["GMAIL_APP_PASSWORD"])
    mailbox.select(all_mail_folder(mailbox), readonly=True)
    return mailbox


def all_mail_folder(mailbox: imaplib.IMAP4_SSL) -> str:
    # All Mail's name depends on the Gmail UI language; its \All flag doesn't.
    # A LIST line looks like: (\HasNoChildren \All) "/" "[Gmail]/All Mail"
    _, folders = mailbox.list()
    return next(folder.decode().split(' "/" ')[1] for folder in folders if b"\\All" in folder)


def fetch_emails(mailbox: imaplib.IMAP4_SSL, query: str, mime_type: str, after: datetime) -> list[Email]:
    """Return every email matching the Gmail search `query` received after `after`."""
    query = f"{query} after:{int(after.timestamp())}"
    _, data = mailbox.uid("search", "X-GM-RAW", f'"{query}"')

    emails = []
    for uid in data[0].split():
        _, response = mailbox.uid("fetch", uid, "(INTERNALDATE BODY.PEEK[])")
        (meta, raw), *_ = response
        message = email.message_from_bytes(raw, policy=email.policy.default)
        emails.append(Email(received_at=parse_internal_date(meta), body=get_body(message, mime_type)))

    return emails


def parse_internal_date(meta: bytes) -> datetime:
    # The time Gmail received the email, e.g. INTERNALDATE "06-Oct-2026 08:42:11 +0000"
    internal_date = re.search(rb'INTERNALDATE "([^"]+)"', meta).group(1).decode()
    return datetime.strptime(internal_date, "%d-%b-%Y %H:%M:%S %z")


def get_body(message: email.message.EmailMessage, mime_type: str) -> str:
    part = next((part for part in message.walk() if part.get_content_type() == mime_type), None)
    return part.get_content() if part else ""
