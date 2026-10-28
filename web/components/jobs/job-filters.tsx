"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MIN_SCORES, SORTS, WORK_STYLES, type Sort } from "@/lib/job-options";
import { cn } from "@/lib/utils";

const WORK_STYLE_LABELS: Record<string, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };

const chip = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 text-[13px] font-medium shadow-[var(--shadow-card)] transition-colors hover:bg-accent",
    active && "bg-primary/[0.06] text-primary ring-1 ring-primary/25 hover:bg-primary/10",
  );

const option = "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-accent [&_svg]:text-primary";

// Filters live in the URL (?q=&ws=&min=&sort=); the feed page reads them on the server.
export function JobFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const typing = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  const workStyles = (params.get("ws") ?? "").split(",").filter(Boolean);
  const minScore = Number(params.get("min") ?? 0);
  const sort = (params.get("sort") ?? "relevance") as Sort;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative md:w-72">
        <Search className="absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            clearTimeout(typing.current);
            typing.current = setTimeout(() => update("q", e.target.value.trim()), 300);
          }}
          placeholder="Search title or company..."
          className="h-9 w-full rounded-full bg-card pr-4 pl-9 text-sm shadow-[var(--shadow-card)] transition-shadow outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        />
      </div>
      {/* overflow-x-auto clips vertically too; padding + negative margin leaves room for the chips' shadow ring */}
      <div className="-mx-4 -my-2 flex gap-2 overflow-x-auto px-4 py-2 md:-mx-1 md:px-1">
        <Popover>
          <PopoverTrigger className={chip(workStyles.length > 0)}>
            Work style
            {workStyles.length > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 font-semibold text-primary-foreground tabular">{workStyles.length}</span>
            )}
            <ChevronDown className="size-3.5 opacity-60" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-44 gap-0 rounded-xl p-1">
            {WORK_STYLES.map((style) => {
              const on = workStyles.includes(style);
              return (
                <button
                  key={style}
                  onClick={() => update("ws", (on ? workStyles.filter((s) => s !== style) : [...workStyles, style]).join(","))}
                  className={option}
                >
                  {WORK_STYLE_LABELS[style]}
                  {on && <Check className="size-3.5" />}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

        <Single
          label="Score"
          options={MIN_SCORES.map((score) => [String(score), score ? `${score}+` : "All"])}
          value={String(minScore)}
          onChange={(value) => update("min", value === "0" ? "" : value)}
        />
        <Single
          label="Sort"
          options={Object.entries(SORTS)}
          value={sort}
          onChange={(value) => update("sort", value === "relevance" ? "" : value)}
        />
      </div>
    </div>
  );
}

function Single({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
}) {
  const current = options.find(([key]) => key === value)?.[1];
  return (
    <Popover>
      <PopoverTrigger className={chip(false)}>
        <span className="text-muted-foreground">{label}</span> {current}
        <ChevronDown className="size-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-40 gap-0 rounded-xl p-1">
        {options.map(([key, text]) => (
          <button key={key} onClick={() => onChange(key)} className={option}>
            {text}
            {key === value && <Check className="size-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
