-- Which of my technologies (scoring/rules.py STACK) the title + description mention; the stack sub-score
-- is computed from them. Shown as tags in the feed. Filled for existing jobs on the next scoring run.
alter table job_scores add column if not exists technologies text[] not null default '{}';
