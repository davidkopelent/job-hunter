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

      <Suspense fallback={<div className="mt-6 h-[66px] rounded-xl border bg-card" />}>
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
  const cells: [string, number][] = [
    ["New", stats.new],
    ["Relevant", stats.relevant],
    ["Saved", stats.saved],
    ["Applied", stats.applied],
  ];
  return (
    <div className="mt-6 grid grid-cols-4 divide-x rounded-xl border bg-card">
      {cells.map(([label, n]) => (
        <div key={label} className="px-4 py-3">
          <div className="font-mono text-xl font-semibold tabular">{n}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
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
    <div className="space-y-8">
      <Section label="Worth your time" jobs={top} />
      <Section label="Other matches" jobs={rest} />
    </div>
  );
}

function Section({ label, jobs }: { label: string; jobs: Job[] }) {
  if (jobs.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label} <span className="font-mono">{jobs.length}</span>
      </h2>
      <div className="grid gap-3">
        {jobs.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} />
        ))}
      </div>
    </section>
  );
}
