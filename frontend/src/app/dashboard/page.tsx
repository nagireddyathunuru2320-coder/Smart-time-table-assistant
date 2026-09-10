import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionToken, backendUrl } from "@/lib/session";
import { GenerateStudyPlanButton } from "@/components/schedule/GenerateStudyPlanButton";
import { Check, ArrowRight } from "lucide-react";
import type { User } from "@/lib/types";
import type { Task } from "@/lib/academic-api";

async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const response = await fetch(backendUrl("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json();
}

async function getDashboardData(token: string): Promise<{
  tasks: Task[];
}> {
  try {
    const tasksRes = await fetch(backendUrl("/tasks"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const tasks = tasksRes.ok ? await tasksRes.json() : [];
    return { tasks };
  } catch {
    return { tasks: [] };
  }
}

export default async function DashboardPage() {
  const token = await getSessionToken();
  if (!token) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tasks } = await getDashboardData(token);

  const pendingTasks = tasks.filter((t) => t.status !== "completed").slice(0, 4);

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex-1 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header with greeting and date badge */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Good day, {user.full_name.split(" ")[0]} 👋
            </h1>
            <p className="mt-1 text-xs text-ink-soft">Keep going. Progress looks great!</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/analytics"
              className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold text-navy hover:bg-white/70"
            >
              <span>View analytics</span>
              <ArrowRight size={13} />
            </Link>
            <span className="glass-panel rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink-soft shadow-xs">
              {todayStr}
            </span>
            <span className="rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-700 ring-1 ring-teal-200/50">
              Stay Consistent
            </span>
          </div>
        </div>

        {/* Actionable overview: analytics metrics live on the Analytics page. */}
        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col gap-6">
            {/* Upcoming Tasks Card */}
            <div className="glass-panel flex flex-col justify-between rounded-2xl p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-sm font-bold text-ink">Upcoming Tasks</p>
                <Link
                  href="/tasks"
                  className="flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
                >
                  <span>View all</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {pendingTasks.length === 0 ? (
                <p className="my-6 text-center text-xs text-ink-soft">All caught up! No pending tasks.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {pendingTasks.map((task) => {
                    const isDueToday =
                      task.deadline_at &&
                      new Date(task.deadline_at).toDateString() === new Date().toDateString();

                    return (
                      <li
                        key={task.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-ink/5 bg-paper/50 p-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-teal-500 text-teal-600">
                            <Check size={12} className="opacity-0 hover:opacity-100" />
                          </span>
                          <div className="truncate">
                            <p className="truncate text-xs font-medium text-ink">{task.title}</p>
                            <p className="text-[10px] text-ink-soft">
                              {isDueToday
                                ? "Today"
                                : task.deadline_at
                                  ? new Date(task.deadline_at).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "No due date"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            task.priority >= 4
                              ? "badge-high"
                              : task.priority === 3
                                ? "badge-medium"
                                : "badge-low"
                          }`}
                        >
                          {task.priority >= 4 ? "High" : task.priority === 3 ? "Medium" : "Low"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-6 border-t border-ink/5 pt-4">
                <GenerateStudyPlanButton variant="compact" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}