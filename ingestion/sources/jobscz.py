import re
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from ingestion.models import Email, Job, JobDetails
from ingestion.scraping import CURRENCY_SYMBOLS, clean, markdown, session

SOURCE = "jobscz"
GMAIL_QUERY = "from:(pomuzeme@jobs.cz)"
# The plain-text part is empty.
MIME_TYPE = "text/html"

# Every job link is an opaque click-tracking redirect (track.jobs.cz) to www.jobs.cz/rpd/<id>/?<tracking>.
LISTING_ID_PATTERN = re.compile(r"^https://www\.jobs\.cz/rpd/(\d+)/")

# Work style is listed among the benefits, in Czech or English.
WORK_STYLES = {
    "Práce převážně z domova": "remote",
    "Work mostly from home": "remote",
    "Možnost občasné práce z domova": "hybrid",
    "Occasional work from home": "hybrid",
}


def parse_jobs(email: Email) -> list[Job]:
    page = BeautifulSoup(email.body, "html.parser")
    jobs = []

    # Each card is a title link, then "Company •Location".
    for title in page.select('a.Link--large[href*="track.jobs.cz"]'):
        info = title.find_next("div", class_="Text--secondary")
        location = info.select_one(".ResultCard__secondBadge")
        source_id = listing_id(title["href"])
        jobs.append(
            Job(
                source=SOURCE,
                source_id=source_id,
                url=f"https://www.jobs.cz/rpd/{source_id}/",
                discovered_at=email.received_at,
                email_title=clean(title.get_text()),
                email_company=clean(info.find(string=True)),
                email_location=location and clean(location.get_text()),
            )
        )

    return jobs


def listing_id(tracking_url: str) -> str:
    """The listing ID a tracking link redirects to; the redirect's own query (with user hashes) is dropped."""
    response = session.get(tracking_url, allow_redirects=False)
    return LISTING_ID_PATTERN.match(response.headers["Location"]).group(1)


def fetch_details(source_id: str, url: str) -> JobDetails:
    response = session.get(f"https://www.jobs.cz/rpd/{source_id}/")
    if response.status_code in (404, 410):
        return JobDetails(closed=True)
    response.raise_for_status()

    # Many listings redirect to the company's career site (<company>.jobs.cz), which renders in the browser:
    # the page has no details, so the email's title, company and location stand in for them.
    if urlparse(response.url).netloc != "www.jobs.cz":
        return JobDetails(closed=False)

    page = BeautifulSoup(response.text, "html.parser")
    description = page.select_one('[data-test="jd-body-richtext"]')
    # Drop the "Pracovní nabídka" label above the text.
    description.select_one("p.text-secondary").decompose()
    salary_text = page.select_one('[data-test="jd-salary"] p')

    return JobDetails(
        closed=False,
        title=clean(page.h1.get_text()),
        company=info(page, "Společnost"),
        location=clean(page.select_one('[data-test="jd-info-location"]').get_text()),
        work_style=work_style(page),
        **salary(salary_text and salary_text.get_text()),
        description=markdown(description.decode_contents()),
    )


def info(page: BeautifulSoup, label: str) -> str | None:
    """A value from the listing's info box, found by its (visually hidden) label."""
    for item in page.select('[data-test="jd-info-item"]'):
        if clean(item.select_one(".accessibility-hidden").get_text()) == label:
            return clean(item.p.get_text())
    return None


def work_style(page: BeautifulSoup) -> list[str] | None:
    benefits = [clean(benefit.get_text()) for benefit in page.select('[data-test="jd-benefits"]')]
    # A job may offer both; dict.fromkeys dedups while keeping order.
    return list(dict.fromkeys(WORK_STYLES[b] for b in benefits if b in WORK_STYLES)) or None


def salary(text: str | None) -> dict:
    # Monthly pay like "60 000 – 80 000 Kč" or "120 000 Kč" (spaces are non-breaking, the dash has zero-width joiners).
    if not text:
        return {}
    text = clean(text.replace("‍", ""))
    values = [float(value) for value in re.findall(r"\d+", text.replace(" ", ""))]
    return {
        "salary": text,
        "salary_min": min(values),
        "salary_max": max(values),
        "salary_currency": CURRENCY_SYMBOLS[text.split()[-1]],
        "salary_period": "month",
    }
