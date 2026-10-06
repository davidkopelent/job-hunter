import { connection } from "next/server";
import { getLastChecked } from "@/lib/jobs";
import { minutesAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

// Ingestion runs on GitHub Actions at :17 every 4 hours UTC (.github/workflows/ingest.yml).
const SCAN_EVERY_HOURS = 4;
const SCAN_MINUTE = 17;

function minutesUntilNextScan(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(SCAN_MINUTE, 0, 0);
  while (next <= now || next.getUTCHours() % SCAN_EVERY_HOURS !== 0) {
    next.setUTCHours(next.getUTCHours() + 1);
  }
  return Math.ceil((next.getTime() - now.getTime()) / 60_000);
}

// Active while checks keep coming (one missed run allowed for GitHub's delays), delayed after that.
function scanState(lastChecked: Date | null): "active" | "delayed" | "failed" {
  if (!lastChecked) return "failed";
  const minutes = minutesAgo(lastChecked);
  return minutes <= (SCAN_EVERY_HOURS + 1) * 60 ? "active" : minutes <= 24 * 60 ? "delayed" : "failed";
}

const TONE = { active: "bg-success", delayed: "bg-warning", failed: "bg-destructive" };
const LABEL = { active: "Search active", delayed: "Search delayed", failed: "Search not running" };

export async function ScanStatus({ compact = false }: { compact?: boolean }) {
  await connection();
  const lastChecked = await getLastChecked();
  const state = scanState(lastChecked);

  return (
    <div className="text-xs">
      <div className="flex items-center gap-2 font-medium">
        <span className="relative flex size-2">
          <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-50", TONE[state])} />
          <span className={cn("relative inline-flex size-2 rounded-full", TONE[state])} />
        </span>
        {LABEL[state]}
      </div>
      {!compact && (
        <div className="mt-1 space-y-0.5 pl-4 text-muted-foreground">
          <div>{lastChecked ? `Last scan ${formatMinutes(minutesAgo(lastChecked))} ago` : "No scan yet"}</div>
          <div>Next scan in {formatMinutes(minutesUntilNextScan())}</div>
        </div>
      )}
    </div>
  );
}

// "14 min", "2h 46m", "3 days"
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const days = Math.floor(minutes / (24 * 60));
  return days === 1 ? "1 day" : `${days} days`;
}
