"""Stage 2: fetch the listing page of every job without details → `job_details`."""

import time
from dataclasses import asdict
from uuid import UUID

import requests

import db
from ingestion.models import JobDetails
from ingestion.sources import SOURCES

# Pause between listing page requests, to stay polite and avoid rate limits.
FETCH_DELAY_SECONDS = 1

INSERT_DETAILS = """
    insert into job_details (
        job_id, closed, title, company, location, work_style,
        salary, salary_min, salary_max, salary_currency, salary_period, description
    )
    values (
        %(job_id)s, %(closed)s, %(title)s, %(company)s, %(location)s, %(work_style)s,
        %(salary)s, %(salary_min)s, %(salary_max)s, %(salary_currency)s, %(salary_period)s, %(description)s
    )
"""


def enrich(conn) -> None:
    pending = get_pending_jobs(conn)
    rate_limited = set()
    enriched = 0

    for job_id, source, source_id, url, *email in pending:
        if source in rate_limited:
            continue

        try:
            details = SOURCES[source].fetch_details(source_id, url)
        except requests.HTTPError as error:
            if error.response.status_code != 429:
                raise
            # Skip this source for the rest of the run; its jobs stay pending for the next one.
            print(f"{source}: rate limited, remaining jobs wait for the next run")
            rate_limited.add(source)
            continue

        # The listing page wins; the email is the fallback (LinkedIn pages hide work style,
        # Jobs.cz career sites render in the browser and show nothing).
        email_work_style, email_title, email_company, email_location = email
        details.work_style = details.work_style or email_work_style
        details.title = details.title or email_title
        details.company = details.company or email_company
        details.location = details.location or email_location
        insert_details(conn, job_id, details)
        enriched += 1
        time.sleep(FETCH_DELAY_SECONDS)

    print(f"enriched {enriched} of {len(pending)} pending jobs")


def get_pending_jobs(conn) -> list[tuple]:
    return conn.execute("""
        select id, source, source_id, url, email_work_style, email_title, email_company, email_location from jobs
        where not exists (select 1 from job_details where job_id = jobs.id)
        order by discovered_at
    """).fetchall()


def insert_details(conn, job_id: UUID, details: JobDetails) -> None:
    conn.execute(INSERT_DETAILS, {"job_id": job_id, **asdict(details)})


if __name__ == "__main__":
    with db.connect() as conn:
        enrich(conn)
