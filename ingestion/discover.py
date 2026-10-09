"""Stage 1: find jobs in emails received since each source's watermark → `jobs`."""

from dataclasses import asdict
from datetime import datetime, timedelta

import db
from ingestion import gmail
from ingestion.models import Job
from ingestion.sources import SOURCES

# Re-read a bit before the watermark: Gmail may index emails late. Upserts make it harmless.
WATERMARK_OVERLAP = timedelta(hours=1)

# Seeing a job again keeps its earliest discovery time (matters when backfilling).
UPSERT_JOB = """
    insert into jobs (
        source, source_id, url, discovered_at, email_work_style, email_title, email_company, email_location
    )
    values (
        %(source)s, %(source_id)s, %(url)s, %(discovered_at)s,
        %(email_work_style)s, %(email_title)s, %(email_company)s, %(email_location)s
    )
    on conflict (source, source_id) do update set
        url = excluded.url,
        discovered_at = least(jobs.discovered_at, excluded.discovered_at),
        email_work_style = coalesce(excluded.email_work_style, jobs.email_work_style),
        email_title = coalesce(excluded.email_title, jobs.email_title),
        email_company = coalesce(excluded.email_company, jobs.email_company),
        email_location = coalesce(excluded.email_location, jobs.email_location)
"""


def discover(conn) -> None:
    watermarks = get_watermarks(conn)

    with gmail.connect() as mailbox:
        for name, source in SOURCES.items():
            after = watermarks[name] - WATERMARK_OVERLAP
            emails = gmail.fetch_emails(mailbox, source.GMAIL_QUERY, source.MIME_TYPE, after)
            jobs = [job for email in emails for job in source.parse_jobs(email)]

            # Jobs and watermark commit together, so a failed run never skips emails.
            with conn.transaction():
                upsert_jobs(conn, jobs)
                if emails:
                    advance_watermark(conn, name, max(email.received_at for email in emails))
                mark_checked(conn, name)

            print(f"{name}: {len(emails)} emails since {after:%Y-%m-%d %H:%M}, {len(jobs)} job links")


def get_watermarks(conn) -> dict[str, datetime]:
    return dict(conn.execute("select source, last_email_at from ingestion_state").fetchall())


def upsert_jobs(conn, jobs: list[Job]) -> None:
    with conn.cursor() as cursor:
        cursor.executemany(UPSERT_JOB, [asdict(job) for job in jobs])


def advance_watermark(conn, source: str, last_email_at: datetime) -> None:
    conn.execute(
        "update ingestion_state set last_email_at = greatest(last_email_at, %s) where source = %s",
        (last_email_at, source),
    )


def mark_checked(conn, source: str) -> None:
    conn.execute("update ingestion_state set last_checked_at = now() where source = %s", (source,))


if __name__ == "__main__":
    with db.connect() as conn:
        discover(conn)
