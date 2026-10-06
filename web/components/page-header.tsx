export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ title, body, extra }: { title: string; body: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed px-6 py-16 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {extra && <div className="mt-3 text-xs text-muted-foreground">{extra}</div>}
    </div>
  );
}

// Page container shared by every page.
export function Page({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <div className={`mx-auto ${narrow ? "max-w-3xl" : "max-w-4xl"} px-4 py-8 md:px-8 md:py-10`}>{children}</div>
  );
}
