import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { MIN_SCORES, SORTS, WORK_STYLES, type Action, type Sort } from "@/lib/job-options";

export * from "@/lib/job-options";


const include = { job_details: true, job_scores: true, job_actions: true } satisfies Prisma.jobsInclude;
export type Job = Prisma.jobsGetPayload<{ include: typeof include }>;

// Every list shows open, scored jobs only.
const OPEN: Prisma.jobsWhereInput = { job_details: { is: { closed: false } }, job_scores: { isNot: null } };
// The feed: no decision yet, or saved for later.
const IN_FEED: Prisma.jobsWhereInput = {
  OR: [{ job_actions: { is: null } }, { job_actions: { is: { action: "saved" } } }],
};


export interface Filters {
  q: string;
  workStyles: string[];
  minScore: number;
  sort: Sort;
}

type SearchParams = Record<string, string | string[] | undefined>;

// Unknown values are ignored: the URL is hand-editable.
export function parseFilters(params: SearchParams): Filters {
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const minScore = Number(one("min"));
  return {
    q: one("q").trim(),
    workStyles: one("ws").split(",").filter((s) => (WORK_STYLES as readonly string[]).includes(s)),
    minScore: (MIN_SCORES as readonly number[]).includes(minScore) ? minScore : 0,
    sort: one("sort") in SORTS ? (one("sort") as Sort) : "relevance",
  };
}

const ORDER: Record<Sort, Prisma.jobsOrderByWithRelationInput> = {
  relevance: { job_scores: { score: "desc" } },
  newest: { discovered_at: "desc" },
  company: { job_details: { company: "asc" } },
};

export async function getFeed(filters: Filters): Promise<Job[]> {
  const where: Prisma.jobsWhereInput[] = [OPEN, IN_FEED, { job_scores: { is: { score: { gte: filters.minScore } } } }];
  if (filters.workStyles.length) {
    where.push({ job_details: { is: { work_style: { hasSome: filters.workStyles } } } });
  }
  if (filters.q) {
    const contains = { contains: filters.q, mode: "insensitive" } as const;
    where.push({ job_details: { is: { OR: [{ title: contains }, { company: contains }] } } });
  }
  return prisma.jobs.findMany({ where: { AND: where }, include, orderBy: ORDER[filters.sort] });
}

export async function getByAction(action: Action): Promise<Job[]> {
  return prisma.jobs.findMany({
    where: { AND: [OPEN, { job_actions: { is: { action } } }] },
    include,
    orderBy: { job_actions: { acted_at: "desc" } },
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getJob(id: string): Promise<Job | null> {
  return UUID.test(id) ? prisma.jobs.findUnique({ where: { id }, include }) : null;
}

// Score at which a job is "worth your time" and counts as relevant.
export const RELEVANT_SCORE = 70;

// cache(): the sidebar, header and page share one query per request.
export const getStats = cache(async () => {
  const count = (where: Prisma.jobsWhereInput) => prisma.jobs.count({ where: { AND: [OPEN, where] } });
  const relevantScore = { job_scores: { is: { score: { gte: RELEVANT_SCORE } } } };
  const [fresh, newRelevant, relevant, saved, applied] = await Promise.all([
    count({ job_actions: { is: null } }),
    count({ job_actions: { is: null }, ...relevantScore }),
    count({ ...relevantScore, NOT: { job_actions: { is: { action: "dismissed" } } } }),
    count({ job_actions: { is: { action: "saved" } } }),
    count({ job_actions: { is: { action: "applied" } } }),
  ]);
  return { new: fresh, newRelevant, relevant, saved, applied };
});

// When ingestion last checked emails; the oldest source wins, so one failing source shows as stale.
export const getLastChecked = cache(async (): Promise<Date | null> => {
  const { _min } = await prisma.ingestion_state.aggregate({ _min: { last_checked_at: true } });
  return _min.last_checked_at;
});
