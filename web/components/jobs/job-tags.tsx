// The technologies from my list that a listing mentions (job_scores.technologies).
export function JobTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-foreground">
          {tag}
        </span>
      ))}
    </div>
  );
}
