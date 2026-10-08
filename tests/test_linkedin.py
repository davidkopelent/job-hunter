from ingestion.sources import linkedin
from tests.conftest import email


def test_parse_jobs_reads_work_style_from_card():
    body = """
<a class="font-bold" href="https://www.linkedin.com/comm/jobs/view/4475565781/?trackingId=x">Data Engineer</a>
<p>Archer Recruitment · Praha (Hybrid)</p>
<a class="font-bold" href="https://www.linkedin.com/comm/jobs/view/4475812902/?trackingId=y">Backend Developer</a>
<p>Acme · Brno</p>
"""
    jobs = linkedin.parse_jobs(email(body))

    assert [(job.source_id, job.email_work_style) for job in jobs] == [
        ("4475565781", ["hybrid"]),
        ("4475812902", None),
    ]
    assert jobs[0].url == "https://www.linkedin.com/jobs/view/4475565781"


def test_fetch_details(serve):
    serve("linkedin")
    details = linkedin.fetch_details("4475565781", "url")

    assert not details.closed
    assert details.title == "Data Engineer"
    assert details.company == "Archer Recruitment"
    assert details.location == "Birkirkara, Malta"
    # Logged-out pages hide work style; it comes from the email instead.
    assert details.work_style is None
    assert (details.salary_min, details.salary_max, details.salary_currency, details.salary_period) == (
        35_000, 45_000, "EUR", "year"
    )
    # Spacer paragraphs (<p><br></p>) don't pile up blank lines.
    assert details.description.startswith("- **Azure & Modern Data Platforms**\n- **Growing Data Team")
    assert "**You will:**\n\n- Design, develop" in details.description


def test_fetch_details_closed(serve):
    serve(status=404)
    assert linkedin.fetch_details("1", "url").closed


def test_salary():
    assert linkedin.salary("CZK50,000.00/mo") == {
        "salary": "CZK50,000.00/mo",
        "salary_min": 50_000,
        "salary_max": 50_000,
        "salary_currency": "CZK",
        "salary_period": "month",
    }
    assert linkedin.salary("$45.00/hr - $60.00/hr")["salary_period"] == "hour"
    assert linkedin.salary(None) == {}
