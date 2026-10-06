from ingestion.sources import linkedin, startupjobs

# Each source module exposes SOURCE, GMAIL_QUERY, MIME_TYPE,
# parse_jobs(email) -> list[Job] and fetch_details(source_id) -> JobDetails.
SOURCES = {source.SOURCE: source for source in (linkedin, startupjobs)}
