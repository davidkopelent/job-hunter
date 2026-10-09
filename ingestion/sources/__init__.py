from ingestion.sources import jobscz, linkedin, startupjobs, wellfound

# Each source module exposes SOURCE, GMAIL_QUERY, MIME_TYPE,
# parse_jobs(email) -> list[Job] and fetch_details(source_id, url) -> JobDetails.
SOURCES = {source.SOURCE: source for source in (jobscz, linkedin, startupjobs, wellfound)}
