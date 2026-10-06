import { Crosshair, LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/login/actions";
import { ActiveBottomNav, ActiveSidebarNav, BottomNav, SidebarNav } from "@/components/nav-links";
import { ScanStatus } from "@/components/scan-status";
import { getStats } from "@/lib/jobs";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:px-5">
        <Brand />
        <div className="md:hidden">
          <Suspense>
            <ScanStatus compact />
          </Suspense>
        </div>
        <form action={logout} className="hidden md:block">
          <button
            type="submit"
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="size-3.5" /> Log out
          </button>
        </form>
      </header>

      <div className="md:flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col border-r bg-sidebar p-3 md:flex">
          <Suspense fallback={<SidebarNav />}>
            <SidebarWithCounts />
          </Suspense>
          <div className="mt-auto rounded-lg border bg-card p-3">
            <Suspense>
              <ScanStatus />
            </Suspense>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>

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

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="JobHunter home">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
        <Crosshair className="size-4" strokeWidth={2.25} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        JobHunter
      </span>
    </Link>
  );
}
