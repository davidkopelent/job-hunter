-- New sources start from the moment they're added, no backlog.
insert into ingestion_state (source, last_email_at)
values ('wellfound', now())
on conflict (source) do nothing;
