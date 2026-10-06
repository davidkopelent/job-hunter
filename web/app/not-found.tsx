import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-10 text-center">
      <p className="font-medium">This position no longer exists.</p>
      <Link href="/" className="mt-2 inline-block text-sm text-link">
        Back to jobs
      </Link>
    </div>
  );
}
