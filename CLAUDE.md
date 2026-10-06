# Job Hunter

Personal job radar: collects job listings, normalizes and deduplicates them, stores them in Supabase, scores them, and shows them in a feed (Save / Dismiss / Apply). Also a Data Engineering portfolio project. Principle: **high signal > complete coverage**. See README.md for the full overview and setup.

## Architecture

```
emails → discover (job IDs) → jobs ─→ enrich (listing page) → job_details → scoring → Next.js feed
```

Emails are only a discovery signal. They give a job's identity, because email previews are unreliable. All details (title, company, location, work style, salary, description, closed) come from the listing page. **One exception:** logged-out LinkedIn pages hide work style, so LinkedIn discovery reads the card's "(Hybrid)" marker into `jobs.email_work_style`. Enrichment uses it only when the page has no value. Never scrape LinkedIn with a logged-in session.

- `ingestion/gmail.py`: Gmail OAuth + `fetch_emails(service, query, mime_type, after)`. It knows nothing about job sources.
- `ingestion/sources/<source>.py`: one module per source. Each exposes `SOURCE`, `GMAIL_QUERY`, `MIME_TYPE`, `parse_jobs(email) -> list[Job]` and `fetch_details(source_id) -> JobDetails`.
- `ingestion/models.py`: `Email`, `Job` (identity: `(source, source_id)`, plus url, `discovered_at` = email receive time, and `email_work_style`) and `JobDetails`.
- Work style is `text[]` of `onsite` / `hybrid` / `remote` (a job may allow several). `null` = unknown.
- `ingestion/sources/__init__.py`: the `SOURCES` registry, used by both stages.
- `ingestion/discover.py`: stage 1, emails → `jobs` (watermarks, upsert).
- `ingestion/enrich.py`: stage 2, listing pages → `job_details` (pending jobs, 429 handling).
- `ingestion/pipeline.py`: runs both stages. Entry point: `python -m ingestion.pipeline`. Each stage also runs alone: `python -m ingestion.discover` / `python -m ingestion.enrich`.
- `ingestion/scraping.py`: shared `requests` session + `clean()` for whitespace.
- `db/`: shared by every stage (ingestion, later scoring). Only `connect()`: psycopg, `DATABASE_URL` in `.env`, Supabase session pooler, autocommit. SQL lives in the stage that writes the table, not in `db/`.

Incremental loading: `ingestion_state.last_email_at` is a watermark for each source. Gmail is queried `after:` watermark minus 1h. Jobs and the watermark advance commit in one transaction per source. New sources start at `now()` (no backlog). Backfill = set the watermark back in time. The upsert keeps the earliest `discovered_at`.

Enrichment processes every job with no `job_details` row, 1 s apart. On a 429 it skips that source until the next run. StartupJobs: schema.org `JobPosting` JSON-LD (missing = closed) + `pracovni-rezim=` tag links for work style. LinkedIn: guest endpoint `jobs-guest/jobs/api/jobPosting/<id>` HTML (`.closed-job` = closed). A 404 = closed. To re-fetch, delete the `job_details` rows. Probe LinkedIn sparingly; it rate-limits quickly.

Adding a source means writing a source module, adding it to `SOURCES`, and adding its `ingestion_state` row in a new migration.

## Database & migrations

- The schema is owned **only** by SQL migrations in `supabase/migrations/`, applied with the Supabase CLI.
- New migration: `supabase migration new <name>` → write SQL → `supabase db push --db-url "$DATABASE_URL"`.
- Never edit an applied migration; add a new one.
- Enable RLS on every new table (Supabase exposes `public` through its REST API; the postgres role used by our code bypasses RLS).
- Prisma (future Next.js app) never migrates the schema. It only queries. After each migration, run `prisma db pull` + `prisma generate`.
- If a Prisma model needs a DB-side default (ids, timestamps), use `dbgenerated(...)`, because Python inserts rows too.

## Stack

Python ingestion · Supabase Postgres · Supabase CLI migrations · Next.js + TypeScript + Tailwind + shadcn/ui + Prisma (queries only) · GitHub Actions cron (later) · deterministic scoring, no LLM for now.

## Code style

- Minimal code. No abstraction until it's needed (prefer modules and functions to classes and base classes).
- No defensive validation or handling for cases that can't happen; let unexpected input fail loudly.
- Keep layers separate: fetching, parsing and storage don't know about each other. One writer per table (ingestion → `jobs`, enrichment → `job_details`, scoring → `job_scores`).
- Dedup on `(source, source_id)`; the DB enforces it with a unique constraint plus upsert.
- Test DB code against Supabase only inside `conn.transaction(force_rollback=True)`.

## Secrets

`credentials.json`, `token.json` and `.env` are local only (gitignored). Never commit or print them.
