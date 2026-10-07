import { LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/login/actions";
import { Brand } from "@/components/brand";
import { ActiveBottomNav, ActiveSidebarNav, BottomNav, SidebarNav } from "@/components/nav-links";
import { ScanStatus } from "@/components/scan-status";
import { getStats } from "@/lib/jobs";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center pt-[env(safe-area-inset-top)] justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:hidden">
        <Link href="/" aria-label="JobHunter home">
          <Brand />
        </Link>
        <Suspense>
          <ScanStatus compact />
        </Suspense>
      </header>

      {/* Floating panel, inset from the viewport edges. */}
      <aside className="fixed inset-y-3 left-3 z-30 hidden w-60 flex-col rounded-2xl bg-sidebar p-3 shadow-[var(--shadow-card)] md:flex">
        <Link href="/" aria-label="JobHunter home" className="mb-5 px-2 pt-1.5">
          <Brand />
        </Link>
        <Suspense fallback={<SidebarNav />}>
          <SidebarWithCounts />
        </Suspense>
        <div className="mt-auto flex flex-col gap-2">
          <div className="rounded-xl bg-secondary p-3">
            <Suspense>
              <ScanStatus />
            </Suspense>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-4 opacity-60" /> Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Left padding clears the panel (15rem + 2 × 0.75rem gap). The right padding mirrors it once the
          window fits a max-w-4xl page (56rem) on top, so the page is centered on the window, not beside the panel. */}
      <main className="pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-[16.5rem] md:pr-[clamp(0px,calc(100%_-_72.5rem),16.5rem)]">{children}</main>

      <Suspense fallback={<BottomNav />}>
        <ActiveBottomNav />
      </Suspense>
    </div>
  );
}

async function SidebarWithCounts() {
  const stats = await getStats();
  const counts = { "/": stats.new, "/saved": stats.saved, "/applied": stats.applied };
  return (
    <Suspense fallback={<SidebarNav counts={counts} />}>
      <ActiveSidebarNav counts={counts} />
    </Suspense>
  );
}
