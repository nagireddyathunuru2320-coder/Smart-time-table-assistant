import { Clock, CheckCircle2, AlertCircle, GraduationCap } from "lucide-react";
import { DailyTrendChart } from "@/components/analytics/DailyTrendChart";
import { StatCard } from "@/components/analytics/StatCard";
import { SubjectBreakdownChart } from "@/components/analytics/SubjectBreakdownChart";
import { UpcomingExamsCard } from "@/components/analytics/UpcomingExamsCard";
import type { AnalyticsSummary } from "@/lib/analytics-api";

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  const goalPct = summary.weekly_goal_minutes > 0
    ? Math.min(100, Math.round((summary.weekly_study_minutes / summary.weekly_goal_minutes) * 100))
    : 0;

  const hours = Math.floor(summary.weekly_study_minutes / 60);
  const minutes = summary.weekly_study_minutes % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Total Study Time"
          value={timeFormatted}
          sublabel={`${goalPct}% of ${Math.round(summary.weekly_goal_minutes / 60)}h goal`}
          trend="+18%"
          trendPositive={true}
          accent="brass"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tasks Completed"
          value={String(summary.tasks_completed)}
          sublabel={`${summary.task_completion_rate}% completion rate`}
          trend="+12%"
          trendPositive={true}
          accent="forest"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Tasks"
          value={String(summary.tasks_pending)}
          sublabel={summary.tasks_overdue > 0 ? `${summary.tasks_overdue} overdue` : "All on track"}
          trend={summary.tasks_overdue > 0 ? `${summary.tasks_overdue} late` : "+0%"}
          trendPositive={summary.tasks_overdue === 0}
          accent={summary.tasks_overdue > 0 ? "brick" : "navy"}
        />
        <StatCard
          icon={GraduationCap}
          label="Upcoming Exams"
          value={summary.upcoming_exams.length > 0 ? `${summary.upcoming_exams[0].days_until}d` : "0"}
          sublabel={summary.upcoming_exams[0]?.title ?? "None scheduled"}
          trend="+6%"
          trendPositive={true}
          accent="navy"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DailyTrendChart data={summary.daily_trend} />
        </div>
        <div>
          <UpcomingExamsCard exams={summary.upcoming_exams} />
        </div>
      </div>

      <SubjectBreakdownChart data={summary.subject_breakdown} />
    </div>
  );
}
