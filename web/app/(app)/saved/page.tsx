import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { JobCard } from "@/components/jobs/job-card";
import { EmptyState, Page, PageHeader } from "@/components/page-header";
import { getByAction } from "@/lib/jobs";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Saved positions — Job Hunter" };

export default function SavedPage() {
  return (
    <Page>
      <Suspense fallback={<PageHeader title="Saved positions" />}>
        <Saved />
      </Suspense>
    </Page>
  );
}

async function Saved() {
  await connection();
  const jobs = await getByAction("saved");
  return (
    <>
      <PageHeader title="Saved positions" subtitle={`${jobs.length} ${jobs.length === 1 ? "position" : "positions"}`} />
      <div className="mt-6 grid gap-3">
        {jobs.length === 0 ? (
          <EmptyState title="No saved positions yet." body="Save interesting jobs to come back to them later." />
        ) : (
          jobs.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} note={`Saved ${timeAgo(job.job_actions!.acted_at)} · Not applied yet`} />
          ))
        )}
      </div>
    </>
  );
}
