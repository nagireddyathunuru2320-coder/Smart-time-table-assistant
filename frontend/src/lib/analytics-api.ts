export interface UpcomingExam {
  id: number;
  title: string;
  exam_at: string;
  days_until: number;
}

export interface DailyTrendPoint {
  day: string;
  planned_minutes: number;
  actual_minutes: number;
}

export interface SubjectBreakdownItem {
  subject_id: number | null;
  subject_name: string;
  subject_color: string;
  minutes: number;
}

export interface AnalyticsSummary {
  weekly_study_minutes: number;
  weekly_goal_minutes: number;
  task_completion_rate: number;
  tasks_completed: number;
  tasks_pending: number;
  tasks_overdue: number;
  upcoming_exams: UpcomingExam[];
  daily_trend: DailyTrendPoint[];
  subject_breakdown: SubjectBreakdownItem[];
}

export async function getAnalyticsSummary(days = 14): Promise<AnalyticsSummary> {
  const response = await fetch(`/api/analytics/summary?days=${days}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail ?? "Failed to load analytics");
  }
  return data;
}
