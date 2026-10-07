import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ApplicationStatusSelect } from "@/components/jobs/application-status-select";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/job-options";
import { EmptyState, Page, PageHeader } from "@/components/page-header";
import { APPLICATION_STATUSES, getByAction, type ApplicationStatus } from "@/lib/jobs";
import { formatDay } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Applications — Job Hunter" };

export default function AppliedPage() {
  return (
    <Page>
      <Suspense fallback={<PageHeader title="Applications" />}>
        <Applications />
      </Suspense>
    </Page>
  );
}

async function Applications() {
  await connection();
  const jobs = await getByAction("applied");
  const statusOf = (job: (typeof jobs)[number]) => job.job_actions!.application_status as ApplicationStatus;
  const inProgress = jobs.filter((job) => statusOf(job) !== "rejected").length;

  return (
    <>
      <PageHeader title="Applications" subtitle={`${inProgress} in progress`} />
      <div className="mt-6 flex flex-wrap gap-2">
        {APPLICATION_STATUSES.map((status) => (
          <span key={status} className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS_TONE[status])}>
            {STATUS_LABEL[status]} <span className="ml-0.5 font-semibold tabular">{jobs.filter((job) => statusOf(job) === status).length}</span>
          </span>
        ))}
      </div>
      <div className="mt-4">
        {jobs.length === 0 ? (
          <EmptyState title="No applications yet." body="Mark positions as applied to track them here." />
        ) : (
          <ul className="card-surface divide-y divide-border/70 overflow-hidden">
            {jobs.map((job) => (
              <li key={job.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center md:px-5">
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${job.id}`} className="font-medium transition-colors hover:text-primary">
                    {job.job_details!.title} <span className="text-muted-foreground">— {job.job_details!.company}</span>
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Applied {formatDay(job.job_actions!.acted_at)} · Score {job.job_scores!.score}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ApplicationStatusSelect jobId={job.id} status={statusOf(job)} />
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open listing"
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <ArrowUpRight className="size-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
