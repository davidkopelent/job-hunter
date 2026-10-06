create table if not exists jobs (
    id uuid primary key default gen_random_uuid(),

    source text not null,
    source_id text not null,

    url text not null,
    title text not null,
    company text not null,
    location text,

    discovered_at timestamptz not null default now(),

    unique (source, source_id)
);

-- Watermark per source: receive time of the newest ingested email.
create table if not exists ingestion_state (
    source text primary key,
    last_email_at timestamptz not null
);

-- New sources start from the moment they're added, no backlog.
insert into ingestion_state (source, last_email_at)
values ('linkedin', now()), ('startupjobs', now())
on conflict (source) do nothing;

-- Supabase exposes the public schema through its REST API; RLS without
-- policies blocks that. The postgres role used by ingestion bypasses RLS.
alter table jobs enable row level security;
alter table ingestion_state enable row level security;
