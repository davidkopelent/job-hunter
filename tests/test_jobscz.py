from ingestion.models import JobDetails
from ingestion.scraping import session
from ingestion.sources import jobscz
from tests.conftest import FakeResponse, email


def test_parse_jobs(monkeypatch):
    body = """
<a class="Link Link--large" href="https://track.jobs.cz/f/a/abc~~/xyz"><span> DATA ENGINEER (junior/medior) </span></a>
<span class="Tag Tag--neutral"> Odpověď do 2 týdnů </span>
<div class="Text Text--small Text--secondary"> Penta Hospitals CZ, s.r.o. <span class="ResultCard__separator">•</span>
<br/><span class="ResultCard__secondBadge">Praha – Radlice</span></div>
"""
    redirect = FakeResponse(302)
    redirect.headers = {"Location": "https://www.jobs.cz/rpd/2001468234/?rps=233&utm_source=email&uhash=secret"}
    monkeypatch.setattr(session, "get", lambda url, allow_redirects: redirect)

    (job,) = jobscz.parse_jobs(email(body))

    # The tracking query (with user hashes) isn't kept.
    assert (job.source_id, job.url) == ("2001468234", "https://www.jobs.cz/rpd/2001468234/")
    assert (job.email_title, job.email_company, job.email_location) == (
        "DATA ENGINEER (junior/medior)", "Penta Hospitals CZ, s.r.o.", "Praha – Radlice"
    )


def test_fetch_details(serve):
    serve("jobscz")
    details = jobscz.fetch_details("2001424340", "url")

    assert not details.closed
    assert details.title == "Procesní inženýr (m/ž) - náborový příspěvek 20.000,- Kč"
    assert details.company == "TI GROUP AUTOMOTIVE SYSTEMS s.r.o."
    assert details.location == "Svárovská 695, Stráž nad Nisou"
    assert details.work_style is None
    assert details.salary == "60 000 – 80 000 Kč"
    assert (details.salary_min, details.salary_max, details.salary_currency, details.salary_period) == (
        60_000, 80_000, "CZK", "month"
    )
    # The "Pracovní nabídka" label is dropped; the text keeps its structure as Markdown.
    assert details.description.startswith("**Popis pozice**\n\nDo našeho libereckého týmu")


def test_fetch_details_work_style_from_benefits(serve):
    serve("jobscz_remote_or_hybrid")
    details = jobscz.fetch_details("2001467955", "url")

    assert details.work_style == ["remote", "hybrid"]
    assert details.salary is None


def test_fetch_details_career_site(serve):
    # The listing redirects to the company's career site, which isn't requested.
    serve(status=302)
    assert jobscz.fetch_details("2001318768", "url") == JobDetails(closed=False)


def test_fetch_details_closed(serve):
    serve(status=404)
    assert jobscz.fetch_details("1", "url").closed
