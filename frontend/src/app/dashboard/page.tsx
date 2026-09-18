import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionToken, backendUrl } from "@/lib/session";
import { GenerateStudyPlanButton } from "@/components/schedule/GenerateStudyPlanButton";
import {
  Check,
  ArrowRight,
  PlusCircle,
  GraduationCap,
  Bot,
  Calendar as CalendarIcon,
  BookOpen,
  Clock,
  Sparkles,
  CheckCircle2,
  CalendarClock,
  Flame,
} from "lucide-react";
import type { User } from "@/lib/types";
import type { Task, Subject } from "@/lib/academic-api";

async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const response = await fetch(backendUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getDashboardData(token: string): Promise<{
  tasks: Task[];
  subjects: Subject[];
}> {
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [tasksRes, subjectsRes] = await Promise.all([
      fetch(backendUrl("/tasks"), { headers, cache: "no-store" }).catch(() => null),
      fetch(backendUrl("/subjects"), { headers, cache: "no-store" }).catch(() => null),
    ]);

    const tasks: Task[] = tasksRes && tasksRes.ok ? await tasksRes.json() : [];
    const subjects: Subject[] = subjectsRes && subjectsRes.ok ? await subjectsRes.json() : [];

    return { tasks, subjects };
  } catch {
    return { tasks: [], subjects: [] };
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const token = await getSessionToken();
  if (!token) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tasks, subjects } = await getDashboardData(token);

  // Map subjects by ID for instant lookup
  const subjectMap = new Map<number, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  // Filter tasks
  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const priorityTasks = [...pendingTasks]
    .sort((a, b) => {
      // Prioritize high priority first, then deadline
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.deadline_at && b.deadline_at) {
        return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
      }
      return 0;
    })
    .slice(0, 6);

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const greeting = getGreeting();

  return (
    <div className="flex-1 px-3 py-5 sm:px-8 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        {/* ================= HERO GREETING BANNER ================= */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/80 bg-gradient-to-br from-white/90 via-white/75 to-sky-50/60 p-5 sm:p-8 backdrop-blur-2xl shadow-lg shadow-sky-500/5">
          {/* Subtle ambient light splash in background */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-sky-400/20 to-teal-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-gradient-to-tr from-teal-400/15 to-indigo-400/10 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 shadow-2xs">
                <Sparkles size={13} className="text-teal-600" />
                <span>Academic Command Center</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                {greeting}, {user.full_name}!
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                Here is your academic overview. Work through your focus priorities and stay on track with your study plan.
              </p>
            </div>

            {/* Badges & Analytics Link */}
            <div className="flex flex-wrap items-center gap-2 sm:self-end md:self-center">
              <span className="inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-md">
                <CalendarIcon size={13} className="text-sky-500" />
                {todayStr}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-teal-200/80 bg-teal-50/90 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-teal-700 shadow-2xs">
                <Flame size={13} className="text-teal-600" />
                <span>{pendingTasks.length} {pendingTasks.length === 1 ? "Task" : "Tasks"} Active</span>
              </span>

              <Link
                href="/analytics"
                className="btn-specular group inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-500 to-sky-600 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02]"
              >
                <span>Analytics</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================= QUICK ACTIONS COMMAND BAR ================= */}
        <div>
          <div className="mb-2.5 flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Actions</h2>
            <span className="text-[11px] font-medium text-slate-400">One-tap shortcuts</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
            {/* Quick Action 1: Add Task */}
            <Link
              href="/tasks"
              className="glass-panel group flex flex-col justify-between rounded-2xl p-3.5 sm:p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20 transition-transform group-hover:scale-105">
                <PlusCircle size={18} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                  Create Task
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Add assignments & tasks</p>
              </div>
            </Link>

            {/* Quick Action 2: Schedule Exam */}
            <Link
              href="/exams"
              className="glass-panel group flex flex-col justify-between rounded-2xl p-3.5 sm:p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
                <GraduationCap size={18} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                  Exams Hub
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">View & schedule exams</p>
              </div>
            </Link>

            {/* Quick Action 3: AI Assistant */}
            <Link
              href="/assistant"
              className="glass-panel group flex flex-col justify-between rounded-2xl p-3.5 sm:p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/20 transition-transform group-hover:scale-105">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
                  AI Study Tutor
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Instant answers & tips</p>
              </div>
            </Link>

            {/* Quick Action 4: Calendar */}
            <Link
              href="/calendar"
              className="glass-panel group flex flex-col justify-between rounded-2xl p-3.5 sm:p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 transition-transform group-hover:scale-105">
                <CalendarClock size={18} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                  Timetable
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Calendar & schedule</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ================= MAIN DASHBOARD CONTENT GRID ================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: PRIORITY TASKS & SCHEDULE OPTIMIZER (7 cols on desktop) */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            {/* Priority Tasks Card */}
            <div className="glass-panel flex flex-col rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
              <div className="mb-4 sm:mb-5 flex items-center justify-between border-b border-slate-100/80 pb-3 sm:pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500"></span>
                    <h2 className="font-display text-sm sm:text-base font-bold text-slate-900">Priority Tasks</h2>
                  </div>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500">Pending tasks sorted by urgency and priority</p>
                </div>
                <Link
                  href="/tasks"
                  className="flex items-center gap-1 rounded-xl bg-slate-100/80 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 transition-colors"
                >
                  <span>All tasks</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {priorityTasks.length === 0 ? (
                <div className="my-6 sm:my-8 flex flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 shadow-2xs">
                    <CheckCircle2 size={22} className="text-teal-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">All caught up!</p>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs">
                    You have no pending tasks on your schedule. Add your next academic goal below.
                  </p>
                  <Link
                    href="/tasks"
                    className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-teal-500/10 px-3.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-500/20 transition-colors"
                  >
                    <PlusCircle size={14} />
                    <span>Create a new task</span>
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-2 sm:gap-2.5">
                  {priorityTasks.map((task) => {
                    const subject = task.subject_id ? subjectMap.get(task.subject_id) : null;
                    const isDueToday =
                      task.deadline_at &&
                      new Date(task.deadline_at).toDateString() === new Date().toDateString();

                    const deadlineDate = task.deadline_at ? new Date(task.deadline_at) : null;
                    const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;

                    return (
                      <li
                        key={task.id}
                        className="group flex items-center justify-between gap-3 rounded-xl sm:rounded-2xl border border-slate-100 bg-white/70 p-3 sm:p-3.5 transition-all hover:border-slate-200 hover:bg-white hover:shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <Link
                            href="/tasks"
                            className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full border border-teal-400/80 text-teal-600 transition-colors hover:bg-teal-500 hover:text-white"
                            title="Go to tasks"
                          >
                            <Check size={12} className="opacity-60 group-hover:opacity-100" />
                          </Link>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                                {task.title}
                              </p>
                              {subject && (
                                <span
                                  className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white"
                                  style={{ backgroundColor: subject.color || "#0EA5E9" }}
                                >
                                  {subject.code || subject.name.slice(0, 4)}
                                </span>
                              )}
                            </div>

                            <div className="mt-0.5 sm:mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="text-slate-400" />
                                {task.estimated_minutes}m
                              </span>

                              <span>•</span>

                              <span
                                className={`font-semibold ${
                                  isOverdue
                                    ? "text-rose-600"
                                    : isDueToday
                                    ? "text-amber-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {isOverdue
                                  ? "Overdue"
                                  : isDueToday
                                  ? "Today"
                                  : task.deadline_at
                                  ? new Date(task.deadline_at).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "No due date"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold capitalize shadow-2xs ${
                            task.priority >= 4
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : task.priority === 3
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-teal-100 text-teal-800 border border-teal-200"
                          }`}
                        >
                          {task.priority >= 4 ? "High" : task.priority === 3 ? "Med" : "Normal"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Study Plan Optimization Section */}
              <div className="mt-5 sm:mt-6 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/70 via-white/80 to-teal-50/70 p-3.5 sm:p-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-sky-600" />
                      Automatic Schedule Optimizer
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Allocate optimal study slots automatically based on tasks and available time.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <GenerateStudyPlanButton variant="compact" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ENROLLED SUBJECTS & COURSE ROSTER (5 cols on desktop) */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Active Subjects Snapshot Card */}
            <div className="glass-panel flex flex-col rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                    <BookOpen size={15} />
                  </div>
                  <h3 className="font-display text-sm font-bold text-slate-900">Enrolled Subjects</h3>
                </div>
                <Link
                  href="/subjects"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {subjects.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-slate-500">No courses registered yet.</p>
                  <Link
                    href="/subjects"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
                  >
                    <PlusCircle size={13} />
                    <span>Add your first course</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {subjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/60 p-2.5 transition-colors hover:bg-white"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white shadow-xs"
                          style={{ backgroundColor: sub.color || "#0EA5E9" }}
                        />
                        <div className="truncate">
                          <p className="truncate text-xs font-bold text-slate-800">{sub.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {sub.instructor ? `Prof. ${sub.instructor}` : "No instructor specified"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {sub.code && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {sub.code}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-400">
                          {Math.round(sub.weekly_target_minutes / 60)}h/wk
                        </span>
                      </div>
                    </div>
                  ))}

                  <Link
                    href="/subjects"
                    className="mt-2 flex items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-2 text-xs font-medium text-slate-500 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50/50 transition-colors"
                  >
                    <PlusCircle size={13} />
                    <span>Add another course</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}