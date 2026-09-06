import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { backendUrl, getSessionToken } from "@/lib/session";
import type { AnalyticsSummary } from "@/lib/analytics-api";

async function getInitialSummary(): Promise<AnalyticsSummary | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const response = await fetch(backendUrl("/analytics/summary?days=14"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json();
}

export default async function AnalyticsPage() {
  const summary = await getInitialSummary();
  if (summary === null) redirect("/login");

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display mb-1 text-2xl font-semibold text-ink">Analytics</h1>
        <p className="mb-6 text-sm text-ink-soft">Your study habits and progress over the last two weeks.</p>
        <AnalyticsDashboard summary={summary} />
      </div>
    </div>
  );
}
