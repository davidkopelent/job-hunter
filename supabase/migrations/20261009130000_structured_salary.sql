-- Salary as numbers, parsed by enrichment from the listing page. `salary` stays as the page shows it, for display.
alter table job_details
    add column if not exists salary_min numeric,
    add column if not exists salary_max numeric,
    add column if not exists salary_currency text,  -- ISO 4217, e.g. 'CZK'
    add column if not exists salary_period text check (salary_period in ('hour', 'day', 'month', 'year'));

-- Re-fetch the jobs that state a salary, so enrichment fills the new columns.
delete from job_details where salary is not null;
