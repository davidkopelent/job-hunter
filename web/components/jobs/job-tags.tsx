// The technologies from my list that a listing mentions (job_scores.technologies).
export function JobTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-primary/[0.07] px-2.5 py-0.5 text-xs font-medium text-primary">
          {tag}
        </span>
      ))}
    </div>
  );
}
