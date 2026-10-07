from ingestion.models import Job
from ingestion.sources import wellfound
from tests.conftest import RECEIVED_AT, email


def test_parse_jobs_reads_slug_links():
    body = """
Founding Product Engineer
Learn More
<https://wellfound.com/jobs?job_listing_slug=4808060-founding-product-engineer>
Not finding what you had in mind? <https://wellfound.com/profile/edit/preferences>
"""
    assert wellfound.parse_jobs(email(body)) == [
        Job("wellfound", "4808060", "https://wellfound.com/jobs/4808060-founding-product-engineer", RECEIVED_AT)
    ]


def test_parse_jobs_ignores_application_emails():
    body = "Your application has been submitted! <https://wellfound.com/jobs/4445999-fullstack-software-engineer>"
    assert wellfound.parse_jobs(email(body)) == []


def test_fetch_details(serve):
    serve("wellfound_json_ld")
    details = wellfound.fetch_details("4808060", "url")

    assert not details.closed
    assert details.title == "Founding Product Engineer"
    assert details.company == "Specsight"
    assert details.location == "Remote: Europe, United States, United Kingdom"
    assert details.work_style == ["remote"]
    assert (details.salary_min, details.salary_max, details.salary_currency, details.salary_period) == (
        165_000, 210_000, "USD", "year"
    )
    assert details.description.startswith("About Specsight")


def test_fetch_details_without_json_ld(serve):
    # About half the listings don't embed JSON-LD; the HTML has everything.
    serve("wellfound_no_json_ld")
    details = wellfound.fetch_details("4804552", "url")

    assert details.title == "Senior Forward Deployed Engineer - Public Sector"
    assert details.company == "Tines"
    assert details.salary_max == 240_000


def test_fetch_details_onsite_or_remote(serve):
    serve("wellfound_onsite_or_remote")
    details = wellfound.fetch_details("4574428", "url")

    assert details.work_style == ["onsite", "remote"]
    assert details.location == "New York City, London · Remote: New York City, London"


def test_fetch_details_closed(serve):
    serve(status=410)
    assert wellfound.fetch_details("4550882", "url").closed


def test_salary():
    assert wellfound.salary("£65k – £75k • 0.1% – 0.5%") == {
        "salary": "£65k – £75k",
        "salary_min": 65_000,
        "salary_max": 75_000,
        "salary_currency": "GBP",
        "salary_period": "year",
    }
    assert wellfound.salary("₹30L – ₹40L")["salary_max"] == 4_000_000
    assert wellfound.salary("") == {}
