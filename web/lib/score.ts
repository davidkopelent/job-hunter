// How a 0–100 score reads in the UI. Calibrated to scoring/rules.py, where a remote data role scores ~95.
export type Tone = "high" | "mid" | "low";

export function scoreTone(score: number): Tone {
  return score >= 70 ? "high" : score >= 50 ? "mid" : "low";
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Strong match";
  if (score >= 55) return "Good match";
  if (score >= 40) return "Possible match";
  return "Weak match";
}

// Sub-scores (0–1) written by scoring, in the order of their weight.
export const SUB_SCORES = [
  { key: "role", label: "Role", hint: "Title fit: data engineering, then backend, full stack, frontend" },
  { key: "work_style", label: "Work style", hint: "Remote first; hybrid and onsite score low" },
  { key: "stack", label: "Tech stack", hint: "Share of your technologies the listing mentions" },
  { key: "seniority", label: "Seniority", hint: "Mid-level fits best; senior is a stretch" },
  { key: "salary", label: "Salary", hint: "Stated salary vs. your 60k CZK/month floor" },
] as const;
