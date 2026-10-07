import re

from bs4 import BeautifulSoup

from ingestion.models import Email, Job, JobDetails
from ingestion.scraping import CURRENCY_SYMBOLS, clean, session

SOURCE = "linkedin"
GMAIL_QUERY = "from:(jobalerts-noreply@linkedin.com)"
MIME_TYPE = "text/html"

JOB_ID_PATTERN = re.compile(r"/comm/jobs/view/(\d+)")

# The card subtitle is "Company · Location (Hybrid)", where the marker is optional and always in English.
# Logged-out listing pages don't show work style, so the email is the only place to read it.
WORK_STYLE_PATTERN = re.compile(r"\((On-site|Hybrid|Remote)\)$")
WORK_STYLES = {"On-site": "onsite", "Hybrid": "hybrid", "Remote": "remote"}

# Salary like "€35,000.00/yr - €45,000.00/yr" or "CZK50,000.00/mo"; the currency is a symbol or a code.
AMOUNT_PATTERN = re.compile(r"([^\d\s-]+)\s?([\d,]+(?:\.\d+)?)/(\w+)")
PERIODS = {"hr": "hour", "day": "day", "mo": "month", "yr": "year"}


def parse_jobs(email: Email) -> list[Job]:
    page = BeautifulSoup(email.body, "html.parser")
    jobs = []

    # Each job card starts with a bold title link, followed by the subtitle paragraph.
    for title in page.select('a.font-bold[href*="/comm/jobs/view/"]'):
        source_id = JOB_ID_PATTERN.search(title["href"]).group(1)
        marker = WORK_STYLE_PATTERN.search(title.find_next("p").get_text(strip=True))
        jobs.append(
            Job(
                source=SOURCE,
                source_id=source_id,
                url=f"https://www.linkedin.com/jobs/view/{source_id}",
                discovered_at=email.received_at,
                email_work_style=marker and [WORK_STYLES[marker.group(1)]],
            )
        )

    return jobs


def fetch_details(source_id: str, url: str) -> JobDetails:
    # Public "guest" endpoint: the listing page without login.
    response = session.get(f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{source_id}")
    if response.status_code == 404:
        return JobDetails(closed=True)
    response.raise_for_status()

    page = BeautifulSoup(response.text, "html.parser")

    def text(selector: str) -> str | None:
        element = page.select_one(selector)
        return element and element.get_text(" ")

    description = page.select_one(".show-more-less-html__markup")

    return JobDetails(
        closed=page.select_one(".closed-job") is not None,
        title=clean(text(".top-card-layout__title")),
        company=clean(text(".topcard__org-name-link")),
        location=clean(text(".topcard__flavor--bullet:not(.num-applicants__figure)")),
        **salary(clean(text(".compensation__salary"))),
        description=description and description.get_text("\n", strip=True),
    )


def salary(text: str | None) -> dict:
    if not text:
        return {}
    amounts = AMOUNT_PATTERN.findall(text)
    currency, _, period = amounts[0]
    values = [float(value.replace(",", "")) for _, value, _ in amounts]
    return {
        "salary": text,
        "salary_min": min(values),
        "salary_max": max(values),
        "salary_currency": CURRENCY_SYMBOLS.get(currency, currency),
        "salary_period": PERIODS[period],
    }
