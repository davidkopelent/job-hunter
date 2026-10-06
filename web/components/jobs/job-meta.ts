import type { Job } from "@/lib/jobs";

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

// "Prague, Czechia · Hybrid / Onsite"
export function placeAndWorkStyle(job: Job): string {
  const details = job.job_details!;
  const workStyle = details.work_style.map(capitalize).join(" / ");
  return [details.location, workStyle].filter(Boolean).join(" · ") || "Location unknown";
}

export const SOURCE_NAMES: Record<string, string> = { linkedin: "LinkedIn", startupjobs: "StartupJobs" };
