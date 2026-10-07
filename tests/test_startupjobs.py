from ingestion.sources import startupjobs
from tests.conftest import email


def test_parse_jobs():
    body = '<a href="https://www.startupjobs.cz/nabidka/108301/senior-devops-engineer?utm_source=jobot">Senior DevOps Engineer</a>'
    jobs = startupjobs.parse_jobs(email(body))

    assert [(job.source_id, job.url) for job in jobs] == [("108301", "https://www.startupjobs.cz/nabidka/108301")]


def test_fetch_details(serve):
    serve("startupjobs")
    details = startupjobs.fetch_details("108301", "url")

    assert not details.closed
    assert details.title == "Senior DevOps Engineer"
    assert details.company == "MyQ"
    assert details.location == "Praha"
    assert details.work_style == ["hybrid", "onsite"]
    assert (details.salary_min, details.salary_max, details.salary_currency, details.salary_period) == (
        150_000, 190_000, "CZK", "month"
    )


def test_fetch_details_closed(serve):
    serve(status=404)
    assert startupjobs.fetch_details("1", "url").closed
