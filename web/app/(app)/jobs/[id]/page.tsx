import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { STATUS_LABEL, STATUS_TONE } from "@/components/jobs/application-status-select";
import { JobActions } from "@/components/jobs/job-actions";
import { placeAndWorkStyle, SOURCE_NAMES } from "@/components/jobs/job-meta";
import { JobScore } from "@/components/jobs/job-score";
import { JobTags } from "@/components/jobs/job-tags";
import { Page } from "@/components/page-header";
import { getJob, type Action, type ApplicationStatus } from "@/lib/jobs";
import { scoreTone, SUB_SCORES } from "@/lib/score";
import { formatDay, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Position — Job Hunter" };

export default function JobPage({ params }: PageProps<"/jobs/[id]">) {
  return (
    <Page narrow>
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to jobs
      </Link>
      <Suspense fallback={<p className="mt-6 text-sm text-muted-foreground">Loading position…</p>}>
        <JobDetail params={params} />
      </Suspense>
    </Page>
  );
}

const WHY = { high: "Why this is a strong match", mid: "Why this could work", low: "Why this is a weak match" };

function barTone(value: number): string {
  return value >= 0.7 ? "bg-success" : value >= 0.4 ? "bg-warning" : "bg-muted-foreground/40";
}

async function JobDetail({ params }: Pick<PageProps<"/jobs/[id]">, "params">) {
  const { id } = await params;
  await connection();
  const job = await getJob(id);
  if (!job?.job_details || !job.job_scores) notFound();

  const details = job.job_details;
  const scores = job.job_scores;
  const action = job.job_actions;
  const status = action?.application_status as ApplicationStatus | null;

  return (
    <>
      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">{details.title}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{details.company}</p>
        <div className="mt-5">
          <JobScore score={scores.score} size="lg" />
        </div>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <Meta label="Location" value={placeAndWorkStyle(job)} />
          {details.salary && <Meta label="Salary" value={details.salary} />}
          <Meta label="Found" value={timeAgo(job.discovered_at)} />
          {details.closed && <Meta label="Status" value="Closed" />}
          {status && <Meta label="Applied" value={formatDay(action!.acted_at)} />}
        </dl>
        {status && (
          <span className={cn("mt-3 inline-block rounded-md px-2 py-1 text-xs font-medium", STATUS_TONE[status])}>
            {STATUS_LABEL[status]}
          </span>
        )}

        <div className="mt-6">
          <JobActions
            job={{ id: job.id, url: job.url, title: details.title ?? "", company: details.company ?? "" }}
            current={(action?.action ?? null) as Action | null}
            size="lg"
          />
        </div>
      </header>

      <Block title={WHY[scoreTone(scores.score)]}>
        <ul className="grid gap-4 sm:grid-cols-2">
          {SUB_SCORES.map(({ key, label, hint }) => {
            const value = scores[key];
            return (
              <li key={key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="font-mono tabular text-muted-foreground">{Math.round(value * 100)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                  <div className={cn("h-full rounded-full", barTone(value))} style={{ width: `${value * 100}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
              </li>
            );
          })}
        </ul>
      </Block>

      <Block title="Technologies">
        {scores.technologies.length > 0 ? (
          <JobTags tags={scores.technologies} />
        ) : (
          <p className="text-sm text-muted-foreground">None of your technologies are mentioned.</p>
        )}
      </Block>

      {details.description && (
        <Block title="Job description">
          <div className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">{details.description}</div>
        </Block>
      )}

      <Block title="Source">
        <div className="flex items-center justify-between">
          <span className="text-sm">{SOURCE_NAMES[job.source] ?? job.source}</span>
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-link hover:underline"
          >
            Open original listing <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </Block>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t pt-6">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
