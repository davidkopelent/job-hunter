"""Full ingestion run: discover new jobs in emails, then enrich them from their listing pages."""

import db
from ingestion.discover import discover
from ingestion.enrich import enrich


def run() -> None:
    with db.connect() as conn:
        discover(conn)
        enrich(conn)


if __name__ == "__main__":
    run()
