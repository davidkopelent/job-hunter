import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { JobCard } from "@/components/jobs/job-card";
import { JobPagination } from "@/components/jobs/job-pagination";
import { EmptyState, Page, PageHeader } from "@/components/page-header";
import { getByAction, parsePage } from "@/lib/jobs";

export const metadata: Metadata = { title: "Dismissed — Job Hunter" };

export default function DismissedPage({ searchParams }: PageProps<"/dismissed">) {
  return (
    <Page>
      <Suspense fallback={<PageHeader title="Dismissed" />}>
        <Dismissed searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Dismissed({ searchParams }: Pick<PageProps<"/dismissed">, "searchParams">) {
  const params = await searchParams;
  await connection();
  const { jobs, total, page, totalPages } = await getByAction("dismissed", parsePage(params));
  return (
    <>
      <PageHeader title="Dismissed" subtitle={`${total} hidden from your feed`} />
      <div className="mt-6 grid gap-3 opacity-90">
        {total === 0 ? (
          <EmptyState title="Nothing dismissed." body="Positions you dismiss from the feed will appear here." />
        ) : (
          jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)
        )}
      </div>
      <JobPagination pathname="/dismissed" params={params} page={page} totalPages={totalPages} />
    </>
  );
}
