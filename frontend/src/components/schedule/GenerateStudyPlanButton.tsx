"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateStudyPlan, type StudyPlanResult } from "@/lib/study-plan-api";

export function GenerateStudyPlanButton({
  variant = "default",
  onGenerated,
}: {
  variant?: "default" | "compact";
  onGenerated?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyPlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateStudyPlan(14);
      setResult(res);
      // Re-fetch server-rendered data (e.g. the Calendar page's event list)
      // so newly created study blocks actually appear without a manual reload.
      router.refresh();
      onGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate study plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={variant === "compact" ? "" : "glass-panel rounded-2xl p-6 shadow-sm"}>
        {variant !== "compact" && (
          <>
            <h2 className="font-display text-lg font-semibold text-ink">Study plan</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Automatically schedule study time for your upcoming tasks and exams, based on
              your free time and preferences.
            </p>
          </>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`mt-3 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-50 ${variant === "compact" ? "mt-0" : ""}`}
        >
          {loading ? "Generating..." : "Generate study plan"}
        </button>

        {error && (
          <p className="mt-3 rounded-md bg-brick-light px-3 py-2 text-sm text-brick">{error}</p>
        )}

        {result && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-sm text-ink">
              {result.created.length === 0
                ? "No new study blocks were needed."
                : `Scheduled ${result.created.length} study block${result.created.length === 1 ? "" : "s"} over the next ${result.horizon_days} days.`}
            </p>

            {result.created.length > 0 && variant !== "compact" && (
              <Link href="/calendar" className="text-sm font-medium text-navy hover:underline">
                View on calendar →
              </Link>
            )}

            {result.unmet.length > 0 && (
              <div className="mt-2 rounded-md bg-brass-light/40 p-3">
                <p className="text-sm font-medium text-ink">
                  Couldn&apos;t fit everything in
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {result.unmet.map((u) => (
                    <li key={`${u.entity_type}-${u.entity_id}`} className="text-sm text-ink-soft">
                      {u.title} — {u.unmet_minutes} min short before its deadline
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

