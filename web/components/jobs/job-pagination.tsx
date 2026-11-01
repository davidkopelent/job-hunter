import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const button = buttonVariants({ variant: "outline", size: "lg" });

// Links keep the rest of the URL (feed filters); page 1 has no ?page=.
export function JobPagination({
  pathname,
  params,
  page,
  totalPages,
}: {
  pathname: string;
  params: Record<string, string | string[] | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const next = new URLSearchParams(params as Record<string, string>);
    if (target > 1) next.set("page", String(target));
    else next.delete("page");
    return next.size ? `${pathname}?${next}` : pathname;
  };

  const previous = (
    <>
      <ChevronLeft /> Previous
    </>
  );
  const following = (
    <>
      Next <ChevronRight />
    </>
  );

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-3">
      {page > 1 ? <Link href={href(page - 1)} className={button}>{previous}</Link> : <span className={cn(button, "pointer-events-none opacity-50")}>{previous}</span>}
      <span className="text-sm text-muted-foreground tabular">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? <Link href={href(page + 1)} className={button}>{following}</Link> : <span className={cn(button, "pointer-events-none opacity-50")}>{following}</span>}
    </nav>
  );
}
