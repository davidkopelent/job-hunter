import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { JobCard } from "@/components/jobs/job-card";
import { JobPagination } from "@/components/jobs/job-pagination";
import { EmptyState, Page, PageHeader } from "@/components/page-header";
import { getByAction, parsePage } from "@/lib/jobs";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Saved positions — Job Hunter" };

export default function SavedPage({ searchParams }: PageProps<"/saved">) {
  return (
    <Page>
      <Suspense fallback={<PageHeader title="Saved positions" />}>
        <Saved searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Saved({ searchParams }: Pick<PageProps<"/saved">, "searchParams">) {
  const params = await searchParams;
  await connection();
  const { jobs, total, page, totalPages } = await getByAction("saved", parsePage(params));
  return (
    <>
      <PageHeader title="Saved positions" subtitle={`${total} ${total === 1 ? "position" : "positions"}`} />
      <div className="mt-6 grid gap-3">
        {total === 0 ? (
          <EmptyState title="No saved positions yet." body="Save interesting jobs to come back to them later." />
        ) : (
          jobs.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} note={`Saved ${timeAgo(job.job_actions!.acted_at)} · Not applied yet`} />
          ))
        )}
      </div>
      <JobPagination pathname="/saved" params={params} page={page} totalPages={totalPages} />
    </>
  );
}
