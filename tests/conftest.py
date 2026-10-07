"""Listing pages are real pages saved in tests/fixtures/; tests never touch the network."""

from datetime import UTC, datetime
from pathlib import Path

import pytest

from ingestion.models import Email
from ingestion.scraping import session

FIXTURES = Path(__file__).parent / "fixtures"
RECEIVED_AT = datetime(2026, 10, 7, 8, 0, tzinfo=UTC)


class FakeResponse:
    def __init__(self, status_code: int, text: str = ""):
        self.status_code = status_code
        self.text = text

    def raise_for_status(self) -> None:
        pass


@pytest.fixture
def serve(monkeypatch):
    """serve("linkedin") answers every request with tests/fixtures/linkedin.html; serve(status=410) with an error."""

    def serve(fixture: str | None = None, status: int = 200) -> None:
        text = (FIXTURES / f"{fixture}.html").read_text() if fixture else ""
        monkeypatch.setattr(session, "get", lambda url: FakeResponse(status, text))

    return serve


def email(body: str) -> Email:
    return Email(received_at=RECEIVED_AT, body=body)
