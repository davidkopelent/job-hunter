-- Written by the feed (Next.js app): my current decision on a job. No row = new, not acted on yet.
-- One row per job, overwritten on change (saved → applied); enough for the feed views and for tuning scoring.
create table if not exists job_actions (
    job_id uuid primary key references jobs(id) on delete cascade,
    action text not null check (action in ('saved', 'dismissed', 'applied')),
    acted_at timestamptz not null default now()
);

alter table job_actions enable row level security;
