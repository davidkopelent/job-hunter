# Job Hunter

Personal job radar: collects job listings, normalizes and deduplicates them, stores them in Supabase, scores them, and shows them in a feed (Save / Dismiss / Apply). Also a Data Engineering portfolio project. Principle: **high signal > complete coverage**. See README.md for the full overview and setup.

## Architecture

```
emails → discover (job IDs) → jobs ─→ enrich (listing page) → job_details → scoring → Next.js feed
```

Emails are only a discovery signal. They give a job's identity, because email previews are unreliable. All details (title, company, location, work style, salary, description, closed) come from the listing page. **Exceptions:** logged-out LinkedIn pages hide work style, so LinkedIn discovery reads the card's "(Hybrid)" marker into `jobs.email_work_style`; Jobs.cz listings that redirect to a company career site render in the browser, so Jobs.cz discovery reads the card into `jobs.email_title` / `email_company` / `email_location`. Enrichment uses these only when the page has no value. Never scrape LinkedIn with a logged-in session.

- `ingestion/gmail.py`: Gmail over IMAP with an app password (`GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD` in `.env`). `connect()` opens All Mail read-only. `fetch_emails(mailbox, query, mime_type, after)` searches with Gmail syntax via `X-GM-RAW`. It knows nothing about job sources. No OAuth: a Testing-mode Cloud app expires tokens every 7 days, and publishing one needs a homepage and a privacy policy.
- `ingestion/sources/<source>.py`: one module per source. Each exposes `SOURCE`, `GMAIL_QUERY`, `MIME_TYPE`, `parse_jobs(email) -> list[Job]` and `fetch_details(source_id, url) -> JobDetails` (`url` is `jobs.url`, for sources whose listing URL isn't derivable from the ID).
- `ingestion/models.py`: `Email`, `Job` (identity: `(source, source_id)`, plus url, `discovered_at` = email receive time, and `email_work_style`) and `JobDetails`.
- Work style is `text[]` of `onsite` / `hybrid` / `remote` (a job may allow several). `null` = unknown.
- Salary: `job_details.salary` is the page's text, for display only. Each source also parses it into `salary_min` / `salary_max` / `salary_currency` (ISO 4217) / `salary_period` (`hour` / `day` / `month` / `year`); scoring reads only those.
- `ingestion/sources/__init__.py`: the `SOURCES` registry, used by both stages.
- `ingestion/discover.py`: stage 1, emails → `jobs` (watermarks, upsert).
- `ingestion/enrich.py`: stage 2, listing pages → `job_details` (pending jobs, 429 handling).
- `ingestion/pipeline.py`: runs both stages. Entry point: `python -m ingestion.pipeline`. Each stage also runs alone: `python -m ingestion.discover` / `python -m ingestion.enrich`.
- `ingestion/scraping.py`: shared `requests` session + `clean()` for whitespace.
- `scoring/rules.py`: preferences (patterns, weights, salary floor) + pure functions mapping a job's details to 0–1 sub-scores. `scoring/score.py`: stage 3, rescores every open job on every run → `job_scores` (upsert). Entry point: `python -m scoring.score`.
- `db/`: shared by every stage (ingestion, scoring). Only `connect()`: psycopg, `DATABASE_URL` in `.env`, Supabase session pooler, autocommit. SQL lives in the stage that writes the table, not in `db/`.

Incremental loading: `ingestion_state.last_email_at` is a watermark for each source. Gmail is queried `after:` watermark minus 1h. Jobs, the watermark advance and `last_checked_at = now()` (set on every successful check, even with no new emails; the feed shows the oldest as "checked X ago") commit in one transaction per source. New sources start at `now()` (no backlog). Backfill = set the watermark back in time. The upsert keeps the earliest `discovered_at`.

Enrichment processes every job with no `job_details` row, 1 s apart. On a 429 it skips that source until the next run. StartupJobs: schema.org `JobPosting` JSON-LD (missing = closed) + `pracovni-rezim=` tag links for work style. LinkedIn: guest endpoint `jobs-guest/jobs/api/jobPosting/<id>` HTML (`.closed-job` = closed). Wellfound: the plain-text email part links `job_listing_slug=<id>-<slug>` (the HTML part only has tracking redirects); the listing page needs the slug and is parsed from HTML (only about half embed JSON-LD): `h1`, side-panel sections "Job Location" / "Remote Work Policy" / "Hires remotely in", `#job-description`; 410 = closed. Jobs.cz: the HTML alert's links are click-tracking redirects, so discovery requests each one (without following it) to read the listing ID from `Location`, dropping the tracking query (it holds user hashes); listing pages on www.jobs.cz are parsed by their `data-test="jd-…"` hooks, work style comes from the benefits ("Práce převážně z domova" = remote, "Možnost občasné práce z domova" = hybrid), and a redirect to `<company>.jobs.cz` returns empty details. A 404 = closed. To re-fetch, delete the `job_details` rows. Probe LinkedIn sparingly; it rate-limits quickly.

Adding a source means writing a source module, adding it to `SOURCES`, adding its `ingestion_state` row in a new migration, and adding `tests/test_<source>.py`.

## Web app (`web/`)

Next.js 16 with Cache Components, so read `web/AGENTS.md` and the bundled docs in `web/node_modules/next/dist/docs/` before writing Next.js code; APIs differ from older versions (`proxy.ts` replaced middleware, request-time data goes behind `<Suspense>`, `refresh()` after mutations). Needs Node ≥ 22.12 (Prisma 7).

- `lib/jobs.ts`: queries. Feed = open, scored jobs with no action or `saved`, filtered by URL params (`q`, `ws`, `min`, `sort`); Saved / Applied / Dismissed pages by `acted_at`. No feed table; it's a join.
- `app/actions.ts`: `setAction(jobId, action | null)` upserts or deletes `job_actions` (applying sets `application_status = 'applied'`), `setApplicationStatus()`; both `refresh()`.
- `lib/auth.ts` + `proxy.ts` + `app/login/`: single password `APP_PASSWORD`. The session cookie is an HMAC keyed by the password (changing it logs everyone out). Every server action calls `requireSession()` too; the proxy alone isn't enough.
- `lib/db.ts`: Prisma 7 client with the `pg` driver adapter; generated into `lib/generated/prisma` (gitignored, `postinstall` regenerates).
- shadcn/ui uses the `base-nova` style (Base UI, not Radix): links styled as buttons use `buttonVariants`, not `asChild`.
- Env (`web/.env`, Vercel): `DATABASE_URL` = Supabase **transaction pooler** (port 6543; the session pooler caps all clients at 15), `APP_PASSWORD`. Prisma pool `max` is 3 per instance. Vercel Root Directory = `web`.
- Design follows the private `davidkopelent/pixel-perfect` Lovable prototype: tokens in `app/globals.css`, shell in `components/app-shell.tsx`, job UI in `components/jobs/`.
- Client components import constants/types from `lib/job-options.ts`, never `lib/jobs.ts` (it imports Prisma, which would end up in the browser bundle).
- `usePathname()` suspends on `/jobs/[id]` under Cache Components: the nav renders it inside `<Suspense>` with a non-highlighted fallback.

## Database & migrations

- The schema is owned **only** by SQL migrations in `supabase/migrations/`, applied with the Supabase CLI.
- New migration: `supabase migration new <name>` → write SQL → `supabase db push --db-url "$DATABASE_URL"`.
- Never edit an applied migration; add a new one.
- Enable RLS on every new table (Supabase exposes `public` through its REST API; the postgres role used by our code bypasses RLS).
- Prisma (`web/`) never migrates the schema. It only queries. After each migration, run `cd web && npm run db:pull` (`prisma db pull` + `prisma generate`).
- If a Prisma model needs a DB-side default (ids, timestamps), use `dbgenerated(...)`, because Python inserts rows too.

## Stack

Python ingestion · Supabase Postgres · Supabase CLI migrations · Next.js + TypeScript + Tailwind + shadcn/ui + Prisma (queries only) · GitHub Actions cron (`.github/workflows/ingest.yml`, every 4 h; secrets `DATABASE_URL`, `GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD`) · deterministic scoring, no LLM for now.

## Tests

`pytest` (from the repo root; `pip install -r requirements-dev.txt`). Plain test functions, no network, no database:
- Listing pages are real pages saved in `tests/fixtures/<name>.html`; the `serve` fixture patches the shared `session.get` to return one (or a status code, for closed listings). When a site changes its layout, save a fresh page as a new fixture and assert on it.
- Emails are short inline snippets in each test, never real emails (they hold personal data and unsubscribe tokens).
- CI: `.github/workflows/test.yml` runs on every push.

## Code style

- Minimal code. No abstraction until it's needed (prefer modules and functions to classes and base classes).
- No defensive validation or handling for cases that can't happen; let unexpected input fail loudly.
- Keep layers separate: fetching, parsing and storage don't know about each other. One writer per table (ingestion → `jobs`, enrichment → `job_details`, scoring → `job_scores`, web app → `job_actions`).
- Dedup on `(source, source_id)`; the DB enforces it with a unique constraint plus upsert.
- Test DB code against Supabase only inside `conn.transaction(force_rollback=True)`.

## Secrets

`.env` is local only (gitignored). Never commit or print it.
