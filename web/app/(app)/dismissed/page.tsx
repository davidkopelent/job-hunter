import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { JobCard } from "@/components/jobs/job-card";
import { EmptyState, Page, PageHeader } from "@/components/page-header";
import { getByAction } from "@/lib/jobs";

export const metadata: Metadata = { title: "Dismissed — Job Hunter" };

export default function DismissedPage() {
  return (
    <Page>
      <Suspense fallback={<PageHeader title="Dismissed" />}>
        <Dismissed />
      </Suspense>
    </Page>
  );
}

async function Dismissed() {
  await connection();
  const jobs = await getByAction("dismissed");
  return (
    <>
      <PageHeader title="Dismissed" subtitle={`${jobs.length} hidden from your feed`} />
      <div className="mt-6 grid gap-3 opacity-90">
        {jobs.length === 0 ? (
          <EmptyState title="Nothing dismissed." body="Positions you dismiss from the feed will appear here." />
        ) : (
          jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)
        )}
      </div>
    </>
  );
}
