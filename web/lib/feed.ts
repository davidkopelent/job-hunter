import { prisma } from "@/lib/db";

// Feed views: "new" = no decision yet, the rest = the job's current action.
export const VIEWS = { new: "New", saved: "Saved", applied: "Applied", dismissed: "Dismissed" } as const;
export type View = keyof typeof VIEWS;
export type Action = Exclude<View, "new">;

export function isView(value: unknown): value is View {
  return typeof value === "string" && value in VIEWS;
}

// Open, scored jobs. New ones by score; acted-on ones by when I acted.
export async function getJobs(view: View) {
  return prisma.jobs.findMany({
    where: {
      job_details: { is: { closed: false } },
      job_scores: { isNot: null },
      job_actions: view === "new" ? { is: null } : { is: { action: view } },
    },
    include: { job_details: true, job_scores: true, job_actions: true },
    orderBy: view === "new" ? { job_scores: { score: "desc" } } : { job_actions: { acted_at: "desc" } },
  });
}

export type FeedJob = Awaited<ReturnType<typeof getJobs>>[number];

// When ingestion last checked emails; the oldest source wins, so one failing source shows as stale.
export async function getLastChecked(): Promise<Date | null> {
  const { _min } = await prisma.ingestion_state.aggregate({ _min: { last_checked_at: true } });
  return _min.last_checked_at;
}
