"use server";

import { refresh } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Action } from "@/lib/feed";

// Record my decision on a job; null clears it, moving the job back to "new".
export async function setAction(jobId: string, action: Action | null): Promise<void> {
  await requireSession();

  if (action === null) {
    await prisma.job_actions.deleteMany({ where: { job_id: jobId } });
  } else {
    await prisma.job_actions.upsert({
      where: { job_id: jobId },
      create: { job_id: jobId, action },
      update: { action, acted_at: new Date() },
    });
  }
  refresh();
}
