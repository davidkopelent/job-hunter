-- Work style: any of onsite / hybrid / remote (a job may allow several); null = unknown.

-- What the email card says. Only LinkedIn emails have it, and LinkedIn pages hide it from logged-out visitors.
alter table jobs add column if not exists email_work_style text[]
    check (email_work_style <@ array['onsite', 'hybrid', 'remote']);

-- Final value: from the listing page, falling back to jobs.email_work_style.
alter table job_details add column if not exists work_style text[]
    check (work_style <@ array['onsite', 'hybrid', 'remote']);
