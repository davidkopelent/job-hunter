import json
import re

from bs4 import BeautifulSoup

from ingestion.models import Email, Job, JobDetails
from ingestion.scraping import clean, session

SOURCE = "startupjobs"
GMAIL_QUERY = "from:(jobot@startupjobs.cz)"
MIME_TYPE = "text/html"

JOB_ID_PATTERN = re.compile(r'href="https://www\.startupjobs\.cz/nabidka/(\d+)/')


def parse_jobs(email: Email) -> list[Job]:
    return [
        # Redirects to the full URL with the slug.
        Job(SOURCE, source_id, f"https://www.startupjobs.cz/nabidka/{source_id}", email.received_at)
        for source_id in JOB_ID_PATTERN.findall(email.body)
    ]


def fetch_details(source_id: str, url: str) -> JobDetails:
    response = session.get(url)
    if response.status_code == 404:
        return JobDetails(closed=True)
    response.raise_for_status()

    # The page embeds a schema.org JobPosting (JSON-LD); closed listings drop it.
    page = BeautifulSoup(response.text, "html.parser")
    nodes = [
        node
        for script in page.select('script[type="application/ld+json"]')
        for node in json.loads(script.string).get("@graph", [])
    ]
    posting = next((node for node in nodes if node["@type"] == "JobPosting"), None)
    if posting is None:
        return JobDetails(closed=True)

    return JobDetails(
        closed=False,
        title=clean(posting["title"]),
        company=clean(posting["hiringOrganization"]["name"]),
        location=location(posting),
        work_style=work_style(page),
        **salary(posting),
        description=BeautifulSoup(posting["description"], "html.parser").get_text("\n", strip=True),
    )


def location(posting: dict) -> str | None:
    places = posting.get("jobLocation", [])
    if isinstance(places, dict):
        places = [places]
    return clean(", ".join(place["address"]["addressLocality"] for place in places))


def work_style(page: BeautifulSoup) -> list[str] | None:
    # Tag links like /nabidky?pracovni-rezim=hybrid; values are onsite, hybrid, remote.
    links = page.select('a[href*="pracovni-rezim="]')
    return [link["href"].split("pracovni-rezim=")[1] for link in links] or None


def salary(posting: dict) -> dict:
    if "baseSalary" not in posting:
        return {}
    amount = posting["baseSalary"]
    value = amount["value"]
    period = value["unitText"].lower()
    return {
        "salary": f"{value['minValue']}–{value['maxValue']} {amount['currency']}/{period}",
        "salary_min": value["minValue"],
        "salary_max": value["maxValue"],
        "salary_currency": amount["currency"],
        "salary_period": period,
    }
