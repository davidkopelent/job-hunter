import re

from bs4 import BeautifulSoup, Tag

from ingestion.models import Email, Job, JobDetails
from ingestion.scraping import CURRENCY_SYMBOLS, clean, markdown, session

SOURCE = "wellfound"
GMAIL_QUERY = "from:(team@hi.wellfound.com)"
# The HTML part only has click-tracking redirects; the plain-text part links the listings directly.
MIME_TYPE = "text/plain"

# Digest links look like wellfound.com/jobs?job_listing_slug=4808060-founding-product-engineer.
# Other emails from the same sender (application confirmations, reminders) don't match.
JOB_PATTERN = re.compile(r"job_listing_slug=(\d+)-([\w-]+)")

# "Remote Work Policy" values, e.g. "Onsite or remote", "Remote only", "In office".
WORK_STYLES = {r"onsite|in office": "onsite", r"hybrid": "hybrid", r"remote": "remote"}

# Annual pay like "£65k – £75k" or "₹30L – ₹40L" (L = lakh).
AMOUNT_PATTERN = re.compile(r"(\D+?)([\d.]+)([kL])")
MULTIPLIERS = {"k": 1_000, "L": 100_000}


def parse_jobs(email: Email) -> list[Job]:
    # The identity is the numeric ID; the listing URL also needs the slug (a wrong slug is a 404).
    return [
        Job(SOURCE, source_id, f"https://wellfound.com/jobs/{source_id}-{slug}", email.received_at)
        for source_id, slug in JOB_PATTERN.findall(email.body)
    ]


def fetch_details(source_id: str, url: str) -> JobDetails:
    response = session.get(url)
    # Closed listings are 410 Gone.
    if response.status_code in (404, 410):
        return JobDetails(closed=True)
    response.raise_for_status()

    # Only about half the listings embed JSON-LD, so this reads the rendered HTML.
    page = BeautifulSoup(response.text, "html.parser")
    title = page.find("h1")
    # Under the title: salary (possibly empty), location summary, experience, employment type.
    summary = [item.get_text(" ", strip=True) for item in title.find_next("ul").find_all("li")]

    return JobDetails(
        closed=False,
        title=clean(title.get_text()),
        # The first company link wraps the logo.
        company=next(clean(link.get_text()) for link in page.select('a[href^="/company/"]') if link.get_text(strip=True)),
        location=location(page),
        work_style=work_style(page),
        **salary(summary[0]),
        description=markdown(page.select_one("#job-description").decode_contents()),
    )


def section(page: BeautifulSoup, label: str) -> Tag | None:
    """A labelled block of the listing's side panel, e.g. "Job Location"."""
    # Match the full text: some headings are split by HTML comments ("Hires remotely <!-- -->in").
    heading = page.find(lambda tag: tag.name == "span" and clean(tag.get_text()) == label)
    return heading and heading.parent


def section_links(page: BeautifulSoup, label: str) -> list[str]:
    block = section(page, label)
    return [link.get_text(strip=True) for link in block.select("a")] if block else []


def location(page: BeautifulSoup) -> str | None:
    # E.g. "London, Porto · Remote: Poland, Portugal"; the summary line abbreviates both lists.
    offices = ", ".join(section_links(page, "Job Location"))
    remote = ", ".join(section_links(page, "Hires remotely in"))
    return clean(" · ".join(filter(None, [offices, remote and f"Remote: {remote}"])))


def work_style(page: BeautifulSoup) -> list[str] | None:
    block = section(page, "Remote Work Policy")
    if block:
        policy = block.find("p").get_text()
        return [style for pattern, style in WORK_STYLES.items() if re.search(pattern, policy, re.I)]
    # Not every listing states a policy; one that hires remotely is at least remote.
    return ["remote"] if section(page, "Hires remotely in") else None


def salary(text: str) -> dict:
    # E.g. "£65k – £75k • 0.1% – 0.5%": annual pay, then optional equity.
    pay = text.split("•")[0].strip()
    if not pay:
        return {}
    amounts = AMOUNT_PATTERN.findall(pay)
    values = [float(value) * MULTIPLIERS[unit] for _, value, unit in amounts]
    return {
        "salary": pay,
        "salary_min": min(values),
        "salary_max": max(values),
        "salary_currency": CURRENCY_SYMBOLS[amounts[0][0].strip(" –-")],
        "salary_period": "year",
    }
