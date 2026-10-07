import { scoreLabel, scoreTone } from "@/lib/score";
import { cn } from "@/lib/utils";

const TONE_TEXT = { high: "text-success", mid: "text-warning", low: "text-muted-foreground/70" };

// The score as a ring filled to score%, with its label beside it.
export function JobScore({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
  const tone = scoreTone(score);
  const lg = size === "lg";
  return (
    <div className="flex items-center gap-3">
      <div className={cn("relative shrink-0", TONE_TEXT[tone], lg ? "size-16" : "size-11")}>
        <svg viewBox="0 0 44 44" className="size-full -rotate-90">
          <circle cx="22" cy="22" r="19" fill="none" strokeWidth="3.5" className="stroke-secondary" />
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${score} 100`}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-semibold tracking-tight text-foreground tabular",
            lg ? "text-xl" : "text-sm",
          )}
        >
          {score}
        </span>
      </div>
      <span className={cn("font-medium", TONE_TEXT[tone], lg ? "text-base" : "text-[13px]")}>{scoreLabel(score)}</span>
    </div>
  );
}

// Fill color for a 0–1 sub-score bar.
export function meterTone(value: number): string {
  return value >= 0.7 ? "bg-success" : value >= 0.4 ? "bg-warning" : "bg-muted-foreground/30";
}

export function Meter({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("block h-1.5 overflow-hidden rounded-full bg-secondary", className)}>
      <span className={cn("block h-full rounded-full", meterTone(value))} style={{ width: `${value * 100}%` }} />
    </span>
  );
}
