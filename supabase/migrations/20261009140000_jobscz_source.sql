-- Jobs.cz listings often redirect to company career sites that render in the browser,
-- so the alert email's card is the fallback for their title, company and location.
alter table jobs
    add column email_title text,
    add column email_company text,
    add column email_location text;

-- New sources start from the moment they're added, no backlog.
insert into ingestion_state (source, last_email_at)
values ('jobscz', now())
on conflict (source) do nothing;
