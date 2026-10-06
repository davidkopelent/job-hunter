-- Emails are only a discovery signal; details come from the listing page.
alter table jobs
    drop column if exists title,
    drop column if exists company,
    drop column if exists location;

-- Set by ingestion to the receive time of the email the job was first seen in.
alter table jobs alter column discovered_at drop default;

-- Written by enrichment; a job without a row here hasn't been fetched yet.
create table if not exists job_details (
    job_id uuid primary key references jobs(id) on delete cascade,

    closed boolean not null,
    title text,
    company text,
    location text,
    salary text,
    description text,

    fetched_at timestamptz not null default now()
);

alter table job_details enable row level security;
