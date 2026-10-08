from dataclasses import dataclass
from datetime import datetime

# Work style values: "onsite", "hybrid", "remote". A job may allow several; None = unknown.
# Salary period values: "hour", "day", "month", "year".


@dataclass
class Email:
    received_at: datetime
    body: str


@dataclass
class Job:
    """A job discovered in an email: its identity, plus hints only the email has."""

    source: str
    source_id: str
    url: str
    discovered_at: datetime
    email_work_style: list[str] | None = None


@dataclass
class JobDetails:
    """What the listing page says about a job. Closed listings may have no details."""

    closed: bool
    title: str | None = None
    company: str | None = None
    location: str | None = None
    work_style: list[str] | None = None
    salary: str | None = None  # as the page shows it, for display
    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str | None = None  # ISO 4217, e.g. "CZK"
    salary_period: str | None = None
    description: str | None = None  # Markdown
