-- Progress of an application, set by the feed. Only applied jobs have one.
alter table job_actions add column if not exists application_status text
    check (application_status in ('applied', 'interview', 'offer', 'rejected'));

update job_actions set application_status = 'applied' where action = 'applied' and application_status is null;

alter table job_actions add constraint job_actions_application_status_check_applied
    check ((action = 'applied') = (application_status is not null));
