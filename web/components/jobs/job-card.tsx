import { Clock, MapPin, Wallet } from "lucide-react";
import Link from "next/link";
import { JobActions } from "@/components/jobs/job-actions";
import { placeAndWorkStyle, SOURCE_NAMES } from "@/components/jobs/job-meta";
import { JobScore } from "@/components/jobs/job-score";
import { JobTags } from "@/components/jobs/job-tags";
import type { Action, Job } from "@/lib/jobs";
import { SUB_SCORES } from "@/lib/score";
import { timeAgo } from "@/lib/time";

// Render only after `await connection()`: shows relative times.
export function JobCard({ job, index = 0, note }: { job: Job; index?: number; note?: React.ReactNode }) {
  const details = job.job_details!;
  const scores = job.job_scores!;

  return (
    <article
      className="group card-surface animate-rise relative p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <JobScore score={scores.score} />
        <span className="text-xs text-muted-foreground">{SOURCE_NAMES[job.source] ?? job.source}</span>
      </div>

      <Link href={`/jobs/${job.id}`} className="mt-3 block">
        <h3 className="text-[17px] font-semibold tracking-tight decoration-border underline-offset-4 group-hover:underline">
          {details.title}
        </h3>
        <p className="text-sm text-muted-foreground">{details.company}</p>
      </Link>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {placeAndWorkStyle(job)}
        </span>
        {details.salary && (
          <span className="flex items-center gap-1.5 text-foreground">
            <Wallet className="size-3.5 text-muted-foreground" />
            {details.salary}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {timeAgo(job.discovered_at)}
        </span>
      </div>

      {scores.technologies.length > 0 && (
        <div className="mt-3">
          <JobTags tags={scores.technologies} />
        </div>
      )}

      <p className="mt-3 text-[13px] text-muted-foreground">
        {SUB_SCORES.map(({ key, label }) => (
          <span key={key} className="mr-3 inline-block">
            {label} <span className="font-mono text-foreground">{Math.round(scores[key] * 100)}%</span>
          </span>
        ))}
      </p>

      {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}

      <div className="mt-4">
        <JobActions
          job={{ id: job.id, url: job.url, title: details.title ?? "", company: details.company ?? "" }}
          current={(job.job_actions?.action ?? null) as Action | null}
        />
      </div>
    </article>
  );
}
