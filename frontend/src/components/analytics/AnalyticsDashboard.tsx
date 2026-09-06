import { DailyTrendChart } from "@/components/analytics/DailyTrendChart";
import { StatCard } from "@/components/analytics/StatCard";
import { SubjectBreakdownChart } from "@/components/analytics/SubjectBreakdownChart";
import { UpcomingExamsCard } from "@/components/analytics/UpcomingExamsCard";
import type { AnalyticsSummary } from "@/lib/analytics-api";

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  const goalPct = summary.weekly_goal_minutes > 0
    ? Math.min(100, Math.round((summary.weekly_study_minutes / summary.weekly_goal_minutes) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Weekly study time" value={`${summary.weekly_study_minutes} min`} sublabel={`${goalPct}% of ${summary.weekly_goal_minutes} min goal`} accent="navy" />
        <StatCard label="Task completion" value={`${summary.task_completion_rate}%`} sublabel={`${summary.tasks_completed} completed`} accent="forest" />
        <StatCard label="Overdue tasks" value={String(summary.tasks_overdue)} sublabel={`${summary.tasks_pending} pending`} accent={summary.tasks_overdue > 0 ? "brick" : "forest"} />
        <StatCard label="Next exam" value={summary.upcoming_exams.length > 0 ? `${summary.upcoming_exams[0].days_until}d` : "—"} sublabel={summary.upcoming_exams[0]?.title ?? "None scheduled"} accent="brass" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><DailyTrendChart data={summary.daily_trend} /></div>
        <UpcomingExamsCard exams={summary.upcoming_exams} />
      </div>
      <SubjectBreakdownChart data={summary.subject_breakdown} />
    </div>
  );
}
