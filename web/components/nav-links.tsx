"use client";

import { EyeOff, LayoutList, Send, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Feed", icon: LayoutList },
  { href: "/saved", label: "Saved", icon: Star },
  { href: "/applied", label: "Applied", icon: Send },
  { href: "/dismissed", label: "Dismissed", icon: EyeOff },
] as const;

export type NavCounts = Partial<Record<(typeof NAV)[number]["href"], number>>;

// Without a pathname (Suspense fallback while prerendering), nothing is highlighted.
function isActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  // Job detail pages belong to the feed.
  return href === "/" ? pathname === "/" || pathname.startsWith("/jobs/") : pathname.startsWith(href);
}

// usePathname() suspends on routes with dynamic params (/jobs/[id]), so the shell renders these
// inside <Suspense>, with the plain SidebarNav / BottomNav as the fallback.
export function ActiveSidebarNav({ counts }: { counts?: NavCounts }) {
  return <SidebarNav counts={counts} pathname={usePathname()} />;
}

export function ActiveBottomNav() {
  return <BottomNav pathname={usePathname()} />;
}

export function SidebarNav({ counts = {}, pathname = null }: { counts?: NavCounts; pathname?: string | null }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "group/nav flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-sidebar-foreground transition-all hover:bg-sidebar-accent/70",
            isActive(item.href, pathname) &&
              "bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent",
          )}
        >
          <item.icon
            className={cn("size-4 opacity-60", isActive(item.href, pathname) && "text-primary opacity-100")}
          />
          {item.label}
          {counts[item.href] ? (
            <span
              className={cn(
                "ml-auto rounded-full bg-secondary px-2 py-px text-[11px] font-medium tabular text-muted-foreground",
                isActive(item.href, pathname) && "bg-primary/10 text-primary",
              )}
            >
              {counts[item.href]}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav({ pathname = null }: { pathname?: string | null }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border/60 bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground transition-colors",
            isActive(item.href, pathname) && "font-medium text-primary",
          )}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
