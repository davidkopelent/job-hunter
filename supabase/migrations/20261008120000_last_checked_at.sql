-- When discovery last checked each source's emails successfully, whether or not new ones arrived.
-- The feed shows the oldest one as "checked X ago", so a failing source shows up as stale.
alter table ingestion_state add column if not exists last_checked_at timestamptz;
