import Link from "next/link";
import { Sparkles, ArrowRight, Calendar, BookOpen, CheckSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-teal-400/15 to-sky-400/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-50/80 px-4 py-1.5 text-xs font-bold text-teal-700 backdrop-blur-md">
          <Sparkles size={14} />
          <span>Smarter Study · Brighter Tomorrow</span>
        </div>

        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
          Your semester, laid out <br />
          <span className="gradient-text">with crystal clarity.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-ink-soft sm:text-base">
          Subjects, tasks, exams, and study sessions—one intelligent workstation that knows how your academic life fits together.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-xl border border-ink/10 bg-white/80 px-6 py-3 text-sm font-bold text-ink shadow-xs backdrop-blur-md transition-colors hover:bg-paper-dim"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="btn-specular gradient-accent inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-md transition-all"
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Feature Highlights Glass Strip */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
          <div className="glass-panel flex items-center gap-3 rounded-2xl p-4 shadow-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Calendar size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-ink">Smart Scheduling</p>
              <p className="text-[11px] text-ink-soft">Auto-adapts to your routine</p>
            </div>
          </div>

          <div className="glass-panel flex items-center gap-3 rounded-2xl p-4 shadow-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <CheckSquare size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-ink">Priority Tasks</p>
              <p className="text-[11px] text-ink-soft">Never miss a critical deadline</p>
            </div>
          </div>

          <div className="glass-panel flex items-center gap-3 rounded-2xl p-4 shadow-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-ink">Subject Tracking</p>
              <p className="text-[11px] text-ink-soft">Target weekly study hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
