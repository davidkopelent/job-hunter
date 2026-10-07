"use client";

import { useTransition } from "react";
import { setApplicationStatus } from "@/app/actions";
import { APPLICATION_STATUSES, STATUS_LABEL, STATUS_TONE, type ApplicationStatus } from "@/lib/job-options";
import { cn } from "@/lib/utils";

export function ApplicationStatusSelect({ jobId, status }: { jobId: string; status: ApplicationStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      aria-label="Application status"
      onChange={(e) => startTransition(() => setApplicationStatus(jobId, e.target.value as ApplicationStatus))}
      className={cn("h-8 rounded-full border-0 px-3 text-xs font-medium outline-none", STATUS_TONE[status])}
    >
      {APPLICATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
