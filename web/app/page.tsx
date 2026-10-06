import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { logout } from "@/app/login/actions";
import { JobCard } from "@/components/job-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { VIEWS, getJobs, getLastChecked, isView, type View } from "@/lib/feed";
import { timeAgo } from "@/lib/time";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Job Hunter</h1>
        <Suspense>
          <LastChecked />
        </Suspense>
        <form action={logout} className="ml-auto">
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      </header>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <Feed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LastChecked() {
  await connection();
  const lastChecked = await getLastChecked();
  return (
    <span className="text-sm text-muted-foreground">
      {lastChecked ? `checked ${timeAgo(lastChecked)}` : "not checked yet"}
    </span>
  );
}

async function Feed({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { view = "new" } = await searchParams;
  if (!isView(view)) notFound();

  await connection();
  const jobs = await getJobs(view);

  return (
    <>
      <nav className="flex gap-1">
        {(Object.entries(VIEWS) as [View, string][]).map(([key, label]) => (
          <Link
            key={key}
            href={key === "new" ? "/" : `/?view=${key}`}
            className={buttonVariants({ variant: key === view ? "secondary" : "ghost", size: "sm" })}
          >
            {label}
          </Link>
        ))}
      </nav>

      {jobs.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </>
  );
}
