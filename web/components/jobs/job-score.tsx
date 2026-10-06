import { scoreLabel, scoreTone } from "@/lib/score";
import { cn } from "@/lib/utils";

const TONE_TEXT = { high: "text-success", mid: "text-warning", low: "text-muted-foreground" };
const TONE_DOT = { high: "bg-success", mid: "bg-warning", low: "bg-muted-foreground/50" };

export function JobScore({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
  const tone = scoreTone(score);
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          "font-mono font-semibold tracking-tight tabular",
          TONE_TEXT[tone],
          size === "lg" ? "text-4xl" : "text-2xl",
        )}
      >
        {score}
      </span>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} />
        {scoreLabel(score)}
      </span>
    </div>
  );
}
