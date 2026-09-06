"use client";

import { useState } from "react";
import { type Conflict, updateConflictStatus } from "@/lib/conflicts-api";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-brick-light text-brick",
  medium: "bg-brass-light/50 text-ink",
  low: "bg-paper-dim text-ink-soft",
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {conflicts.filter((c) => c.status === "open").length} open conflict
          {conflicts.filter((c) => c.status === "open").length === 1 ? "" : "s"}
        </p>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="h-4 w-4 accent-navy"
          />
          Show resolved &amp; dismissed
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-brick-light px-3 py-2 text-sm text-brick">{error}</p>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title={showResolved ? "No conflicts at all!" : "Your schedule looks clear."}
          description={showResolved ? "There are no resolved or dismissed conflicts." : "No open conflicts need your attention."}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((conflict) => (
            <li
              key={conflict.id}
              className="glass-panel flex items-start justify-between gap-4 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SEVERITY_STYLES[conflict.severity]}`}
                  >
                    {conflict.severity}
                  </span>
                  <span className="rounded-full bg-paper-dim px-2 py-0.5 text-xs font-medium capitalize text-ink-soft">
                    {conflict.status}
                  </span>
                </div>
                <p className="font-display mt-2 font-medium text-ink">{conflict.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{conflict.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {conflict.status === "open" ? (
                  <button
                    onClick={() => handleDismiss(conflict.id)}
                    className="rounded-md border border-ink-faint/25 px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-dim"
                  >
                    Dismiss
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopen(conflict.id)}
                    className="rounded-md border border-ink-faint/25 px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-dim"
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

