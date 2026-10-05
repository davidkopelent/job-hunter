import re
from urllib.parse import urlparse

from ingestion.models import Job


JOB_URL_PATTERN = re.compile(
    r"Zobrazit pracovní příležitost:\s*"
    r"(https://www\.linkedin\.com/comm/jobs/view/\d+[^\s]*)"
)


def parse_jobs(body: str) -> list[Job]:
    jobs = []

    # Normalize whitespace while keeping line structure.
    lines = [
        line.strip()
        for line in body.splitlines()
        if line.strip()
    ]

    for i, line in enumerate(lines):
        match = JOB_URL_PATTERN.search(line)

        if not match:
            continue

        url = match.group(1)
        source_id = urlparse(url).path.rstrip("/").split("/")[-1]

        # The three lines immediately before the URL are:
        # title
        # company
        # location
        if i < 3:
            continue

        title = lines[i - 3]
        company = lines[i - 2]
        location = lines[i - 1]

        jobs.append(
            Job(
                source="linkedin",
                source_id=source_id,
                url=url,
                title=title,
                company=company,
                location=location,
            )
        )

    return jobs