import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-10 text-center">
      <p className="text-2xl font-bold tracking-tight">This position no longer exists.</p>
      <Link href="/" className="mt-3 inline-block text-sm font-medium text-link hover:underline">
        Back to jobs
      </Link>
    </div>
  );
}
