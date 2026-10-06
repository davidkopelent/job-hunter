"use client";

import { ArrowUpRight, Check, Star, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { setAction } from "@/app/actions";
import { btnGhost, btnOutline, btnPrimary } from "@/components/jobs/styles";
import type { Action } from "@/lib/job-options";
import { cn } from "@/lib/utils";

interface Props {
  job: { id: string; url: string; title: string; company: string };
  current: Action | null;
  size?: "md" | "lg";
}

// Save / Mark as applied / Dismiss for a card or the detail page. Dismissing offers an Undo toast.
export function JobActions({ job, current, size = "md" }: Props) {
  const [pending, startTransition] = useTransition();
  const lg = size === "lg" && "h-10 px-4 text-sm";

  const set = (action: Action | null, after?: () => void) =>
    startTransition(async () => {
      await setAction(job.id, action);
      after?.();
    });

  const dismiss = () =>
    set("dismissed", () =>
      toast("Job dismissed", {
        description: `${job.title} · ${job.company}`,
        action: { label: "Undo", onClick: () => set(current) },
      }),
    );

  if (current === "dismissed") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <ViewLink url={job.url} className={lg} />
        <button disabled={pending} onClick={() => set(null)} className={cn(btnGhost, "ml-auto", lg)}>
          Restore
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ViewLink url={job.url} className={lg} />
      {current === "applied" ? (
        <button
          disabled={pending}
          onClick={() => set(null)}
          title="Click to undo"
          className={cn(btnOutline, "border-success/30 bg-success-soft text-success hover:bg-success-soft", lg)}
        >
          <Check className="size-3.5" /> Applied
        </button>
      ) : (
        <button
          disabled={pending}
          onClick={() => set("applied", () => toast.success("Marked as applied"))}
          className={cn(current === "saved" ? btnOutline : btnGhost, lg)}
        >
          <Check className="size-3.5" /> Mark as applied
        </button>
      )}
      {current !== "applied" && (
        <button
          disabled={pending}
          onClick={() => set(current === "saved" ? null : "saved")}
          className={cn(btnGhost, current === "saved" && "text-warning", lg)}
        >
          <Star className={cn("size-3.5", current === "saved" && "fill-current")} />
          {current === "saved" ? "Saved" : "Save"}
        </button>
      )}
      <button disabled={pending} onClick={dismiss} className={cn(btnGhost, "ml-auto hover:text-destructive", lg)}>
        <X className="size-3.5" /> Dismiss
      </button>
    </div>
  );
}

function ViewLink({ url, className }: { url: string; className?: string | false }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className={cn(btnPrimary, className)}>
      View position <ArrowUpRight className="size-3.5" />
    </a>
  );
}
