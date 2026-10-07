import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Greeting } from "@/components/greeting";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilters } from "@/components/jobs/job-filters";
import { EmptyState, Page, PageHeader } from "@/components/page-header";
import { formatMinutes } from "@/components/scan-status";
import { getFeed, getLastChecked, getStats, parseFilters, RELEVANT_SCORE, type Job } from "@/lib/jobs";
import { minutesAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Feed — Job Hunter" };

export default function FeedPage({ searchParams }: PageProps<"/">) {
  return (
    <Page>
      <PageHeader
        title={<Greeting name="David" />}
        subtitle={
          <Suspense fallback={<>&nbsp;</>}>
            <Summary />
          </Suspense>
        }
      />

      <Suspense fallback={<div className="mt-6 h-[88px]" />}>
        <Stats />
      </Suspense>

      <div className="mt-6">
        <Suspense>
          <JobFilters />
        </Suspense>
      </div>

      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading positions…</p>}>
          <FeedList searchParams={searchParams} />
        </Suspense>
      </div>
    </Page>
  );
}

async function Summary() {
  await connection();
  const [stats, lastChecked] = await Promise.all([getStats(), getLastChecked()]);
  return (
    <>
      <span className="font-medium text-foreground">{stats.newRelevant} new relevant positions</span>
      {lastChecked && ` · Last scan ${formatMinutes(minutesAgo(lastChecked))} ago`}
    </>
  );
}

async function Stats() {
  const stats = await getStats();
  const cells: [string, number, string][] = [
    ["New", stats.new, "bg-primary"],
    ["Relevant", stats.relevant, "bg-success"],
    ["Saved", stats.saved, "bg-warning"],
    ["Applied", stats.applied, "bg-[#0096ff]"],
  ];
  return (
    <div className="mt-6 grid grid-cols-4 gap-2 md:gap-3">
      {cells.map(([label, n, dot]) => (
        <div key={label} className="card-surface px-3 py-3 md:px-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`size-1.5 rounded-full ${dot}`} />
            {label}
          </div>
          <div className="mt-1 text-2xl leading-none font-bold tracking-tight tabular md:text-3xl">{n}</div>
        </div>
      ))}
    </div>
  );
}

async function FeedList({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const filters = parseFilters(await searchParams);
  await connection();
  const jobs = await getFeed(filters);

  if (jobs.length === 0) {
    const filtered = filters.q || filters.workStyles.length || filters.minScore;
    return filtered ? (
      <EmptyState title="No positions match your filters." body="Try lowering the minimum score or clearing the search." />
    ) : (
      <EmptyState title="You're all caught up." body="No new positions since your last visit." />
    );
  }

  const top = jobs.filter((job) => job.job_scores!.score >= RELEVANT_SCORE);
  const rest = jobs.filter((job) => job.job_scores!.score < RELEVANT_SCORE);
  return (
    <div className="space-y-10">
      <Section label="Worth your time" jobs={top} />
      <Section label="Other matches" jobs={rest} />
    </div>
  );
}

function Section({ label, jobs }: { label: string; jobs: Job[] }) {
  if (jobs.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
        <span className="rounded-full bg-secondary px-2 py-px text-[11px] tracking-normal tabular">{jobs.length}</span>
        <span className="h-px flex-1 bg-border" />
      </h2>
      <div className="grid gap-3">
        {jobs.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} />
        ))}
      </div>
    </section>
  );
}
