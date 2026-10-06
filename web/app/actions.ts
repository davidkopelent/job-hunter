"use server";

import { refresh } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Action, ApplicationStatus } from "@/lib/jobs";

// Record my decision on a job; null clears it, moving the job back to the feed as new.
// Applying starts the application at "applied".
export async function setAction(jobId: string, action: Action | null): Promise<void> {
  await requireSession();

  if (action === null) {
    await prisma.job_actions.deleteMany({ where: { job_id: jobId } });
  } else {
    const data = { action, application_status: action === "applied" ? "applied" : null, acted_at: new Date() };
    await prisma.job_actions.upsert({ where: { job_id: jobId }, create: { job_id: jobId, ...data }, update: data });
  }
  refresh();
}

export async function setApplicationStatus(jobId: string, status: ApplicationStatus): Promise<void> {
  await requireSession();
  await prisma.job_actions.update({ where: { job_id: jobId, action: "applied" }, data: { application_status: status } });
  refresh();
}
