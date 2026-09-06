import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-24 text-center">
      <span className="mb-4 inline-block rounded-full border border-brass/40 bg-brass-light/40 px-3 py-1 font-mono text-xs uppercase tracking-wider text-ink-soft">
        For students, by design
      </span>
      <h1 className="font-display max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
        <span className="gradient-text">Your semester, laid out clearly.</span>
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
        Subjects, tasks, exams, and study time — one calendar that understands how your
        coursework actually fits together.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/login" className="rounded-md border border-ink-faint/25 px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-navy hover:text-navy">
          Log in
        </Link>
        <Link href="/register" className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark">
          Get started
        </Link>
      </div>
    </div>
  );
}
