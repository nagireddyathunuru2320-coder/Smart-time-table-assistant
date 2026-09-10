"use client";

import { useState } from "react";
import { type Conflict, updateConflictStatus } from "@/lib/conflicts-api";
import { CalendarCheck, CheckCircle2 } from "lucide-react";

const SEVERITY_STYLES: Record<string, string> = {
  high: "badge-high",
  medium: "badge-medium",
  low: "badge-low",
};

export function ConflictList({ initialConflicts }: { initialConflicts: Conflict[] }) {
  const [conflicts, setConflicts] = useState<Conflict[]>(initialConflicts);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  async function handleDismiss(id: number) {
    setError(null);
    try {
      const updated = await updateConflictStatus(id, "dismissed");
      setConflicts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not dismiss conflict");
    }
  }

  async function handleReopen(id: number) {
    setError(null);
    try {
      const updated = await updateConflictStatus(id, "open");
      setConflicts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reopen conflict");
    }
  }

  const visible = conflicts.filter((c) => (showResolved ? true : c.status === "open"));
  const sorted = [...visible].sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {conflicts.filter((c) => c.status === "open").length} open conflict
          {conflicts.filter((c) => c.status === "open").length === 1 ? "" : "s"}
        </p>
        <label className="flex items-center gap-2 text-xs font-medium text-ink-soft cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-navy"
          />
          Show resolved &amp; dismissed
        </label>
      </div>

      {error && (
        <p className="rounded-xl bg-brick-light px-4 py-2 text-xs font-medium text-brick">
          {error}
        </p>
      )}

      {sorted.length === 0 ? (
        <div className="glass-panel relative flex flex-col items-center justify-center overflow-hidden rounded-3xl p-12 text-center shadow-xs">
          <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-100/90 to-sky-100/90 shadow-sm ring-1 ring-teal-200/50">
            <CalendarCheck size={44} className="text-[#0EA5E9]" />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
              <CheckCircle2 size={16} />
            </span>
          </div>

          <h2 className="font-display text-xl font-bold tracking-tight text-ink">
            {showResolved ? "No conflicts at all!" : "No conflicts found"}
          </h2>
          <p className="mt-1.5 max-w-sm text-xs text-ink-soft leading-relaxed">
            {showResolved
              ? "There are no resolved or dismissed conflicts in your records."
              : "Your schedule looks clear! Keep up the good planning."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((conflict) => (
            <li
              key={conflict.id}
              className="glass-panel flex items-start justify-between gap-4 rounded-2xl p-5 shadow-xs"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${SEVERITY_STYLES[conflict.severity]}`}
                  >
                    {conflict.severity}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                      conflict.status === "resolved" ? "badge-done" : "bg-paper px-2 py-0.5 text-ink-soft"
                    }`}
                  >
                    {conflict.status}
                  </span>
                </div>
                <p className="font-display mt-2 font-semibold text-ink">{conflict.title}</p>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">{conflict.description}</p>
              </div>

              <div className="flex shrink-0 gap-2">
                {conflict.status === "open" ? (
                  <button
                    onClick={() => handleDismiss(conflict.id)}
                    className="rounded-lg border border-ink/10 bg-white/80 px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-dim"
                  >
                    Dismiss
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopen(conflict.id)}
                    className="rounded-lg border border-ink/10 bg-white/80 px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-dim"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
