-- Written by scoring, which rescores every open job on each run (rules are deterministic and cheap).
-- Sub-scores are 0–1, kept so the feed can explain the total.
create table if not exists job_scores (
    job_id uuid primary key references jobs(id) on delete cascade,

    score smallint not null check (score between 0 and 100),
    role real not null,
    seniority real not null,
    work_style real not null,
    stack real not null,
    salary real not null,

    scored_at timestamptz not null default now()
);

alter table job_scores enable row level security;
