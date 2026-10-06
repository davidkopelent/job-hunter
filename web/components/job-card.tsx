import { setAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Action, FeedJob } from "@/lib/feed";
import { timeAgo } from "@/lib/time";

// Sub-scores (0–1) from scoring/rules.py; shown so the total is explainable.
const SUB_SCORES = [
  ["role", "Role"],
  ["work_style", "Work style"],
  ["stack", "Stack"],
  ["seniority", "Seniority"],
  ["salary", "Salary"],
] as const;

const ACTIONS: [Action, string][] = [
  ["saved", "Save"],
  ["applied", "Applied"],
  ["dismissed", "Dismiss"],
];

export function JobCard({ job }: { job: FeedJob }) {
  const details = job.job_details!;
  const scores = job.job_scores!;
  const current = job.job_actions?.action ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <a href={job.url} target="_blank" rel="noreferrer" className="hover:underline">
            {details.title}
          </a>
        </CardTitle>
        <CardDescription>{[details.company, details.location].filter(Boolean).join(" · ")}</CardDescription>
        <CardAction className="text-2xl font-semibold tabular-nums">{scores.score}</CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {details.work_style.map((style) => (
            <Badge key={style} variant="secondary">
              {style}
            </Badge>
          ))}
          {details.salary && <Badge variant="outline">{details.salary}</Badge>}
          <Badge variant="outline">{job.source}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {SUB_SCORES.map(([key, label]) => `${label} ${Math.round(scores[key] * 100)}%`).join(" · ")}
          {" · "}found {timeAgo(job.discovered_at)}
        </p>
      </CardContent>

      <CardFooter className="gap-2">
        {ACTIONS.filter(([action]) => action !== current).map(([action, label]) => (
          <form key={action} action={setAction.bind(null, job.id, action)}>
            <SubmitButton variant={action === "dismissed" ? "ghost" : "outline"} size="sm">
              {label}
            </SubmitButton>
          </form>
        ))}
        {current && (
          <form action={setAction.bind(null, job.id, null)}>
            <SubmitButton variant="ghost" size="sm">
              Undo
            </SubmitButton>
          </form>
        )}
      </CardFooter>
    </Card>
  );
}
