"use client";

import { useTransition } from "react";
import { setApplicationStatus } from "@/app/actions";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/job-options";
import { cn } from "@/lib/utils";

export const STATUS_TONE: Record<ApplicationStatus, string> = {
  applied: "bg-secondary text-foreground",
  interview: "bg-warning-soft text-warning",
  offer: "bg-success-soft text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export function ApplicationStatusSelect({ jobId, status }: { jobId: string; status: ApplicationStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      aria-label="Application status"
      onChange={(e) => startTransition(() => setApplicationStatus(jobId, e.target.value as ApplicationStatus))}
      className={cn("h-8 rounded-md border-0 px-2 text-xs font-medium outline-none", STATUS_TONE[status])}
    >
      {APPLICATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
