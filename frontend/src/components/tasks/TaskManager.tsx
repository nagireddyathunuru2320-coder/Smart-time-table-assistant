"use client";

import { useState } from "react";
import {
  type Task,
  type TaskInput,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/academic-api";
import type { Subject } from "@/lib/academic-api";
import { CheckSquare, Plus, Clock, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const TASK_TYPES = ["assignment", "reading", "project", "quiz", "lab", "other"];
const STATUSES = ["pending", "in_progress", "completed"];

const EMPTY_FORM: TaskInput = {
  subject_id: null,
  title: "",
  description: "",
  task_type: "assignment",
  priority: 3,
  difficulty: 3,
  estimated_minutes: 60,
  deadline_at: "",
  status: "pending",
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusBadgeClasses(status: string, priority: number, deadline?: string | null): string {
  if (status === "completed") return "badge-done";
  if (deadline && new Date(deadline) < new Date()) return "badge-high";
  if (priority >= 4) return "badge-high";
  if (priority === 3) return "badge-medium";
  return "badge-low";
}

function statusLabel(status: string, deadline: string | null): string {
  const overdue = deadline && new Date(deadline) < new Date() && status !== "completed";
  if (overdue) return "Overdue";
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  return "Pending";
}

export function TaskManager({
  initialTasks,
  subjects,
}: {
  initialTasks: Task[];
  subjects: Subject[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [form, setForm] = useState<TaskInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "completed">("all");

  function subjectName(id: number | null): string | null {
    if (id === null) return null;
    return subjects.find((s) => s.id === id)?.name ?? null;
  }

  function subjectColor(id: number | null): string {
    if (id === null) return "#8A8580";
    return subjects.find((s) => s.id === id)?.color ?? "#8A8580";
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setForm({
      subject_id: task.subject_id,
      title: task.title,
      description: task.description ?? "",
      task_type: task.task_type,
      priority: task.priority,
      difficulty: task.difficulty,
      estimated_minutes: task.estimated_minutes,
      deadline_at: toDatetimeLocal(task.deadline_at),
      status: task.status,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload: TaskInput = {
      ...form,
      deadline_at: form.deadline_at ? new Date(form.deadline_at).toISOString() : null,
      description: form.description || null,
      subject_id: form.subject_id ? Number(form.subject_id) : null,
    };

    try {
      if (editingId !== null) {
        const updated = await updateTask(editingId, payload);
        setTasks((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      } else {
        const created = await createTask(payload);
        setTasks((prev) => [...prev, created]);
      }
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleComplete(task: Task) {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    try {
      const updated = await updateTask(task.id, {
        status: nextStatus,
        completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update task");
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;

    setError(null);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete task");
    }
  }

  const allCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status !== "completed").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const filteredTasks = tasks.filter((t) => {
    if (filterTab === "pending") return t.status !== "completed";
    if (filterTab === "completed") return t.status === "completed";
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return b.priority - a.priority;
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Form Column */}
      <div className="lg:col-span-1">
        <form
          onSubmit={handleSubmit}
          className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:p-7 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Plus size={16} />
            </span>
            <h2 className="font-display text-base font-bold text-ink">
              {editingId !== null ? "Edit Task" : "New Task"}
            </h2>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter task title"
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Subject</label>
            <select
              value={form.subject_id ?? ""}
              onChange={(e) =>
                setForm({ ...form, subject_id: e.target.value ? Number(e.target.value) : null })
              }
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Type</label>
              <select
                value={form.task_type}
                onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none capitalize"
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
              >
                <option value={1}>1 - Low</option>
                <option value={2}>2 - Low</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Est. minutes</label>
              <input
                type="number"
                min={1}
                max={10080}
                value={form.estimated_minutes}
                onChange={(e) => setForm({ ...form, estimated_minutes: Number(e.target.value) })}
                className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Due Date</label>
            <input
              type="datetime-local"
              value={form.deadline_at ?? ""}
              onChange={(e) => setForm({ ...form, deadline_at: e.target.value })}
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Optional notes or details"
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-brick-light px-3.5 py-2 text-xs font-medium text-brick">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-specular gradient-accent flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId !== null ? "Save Changes" : "Add Task"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-ink-faint/25 bg-white px-4 py-2.5 text-xs font-semibold text-ink-soft hover:bg-paper-dim"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Tasks List Column */}
      <div className="lg:col-span-2">
        {/* Filter Pills */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-full border border-ink/5 bg-white/70 p-1 backdrop-blur-md">
            <button
              onClick={() => setFilterTab("all")}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                filterTab === "all"
                  ? "gradient-accent text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              All ({allCount})
            </button>
            <button
              onClick={() => setFilterTab("pending")}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                filterTab === "pending"
                  ? "gradient-accent text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab("completed")}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                filterTab === "completed"
                  ? "gradient-accent text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {sortedTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={
              filterTab === "completed"
                ? "No completed tasks yet!"
                : filterTab === "pending"
                  ? "No pending tasks!"
                  : "No tasks yet!"
            }
            description="Stay ahead of your semester by adding your assignments and tasks."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedTasks.map((task) => {
              return (
                <li
                  key={task.id}
                  className="glass-panel flex items-start justify-between overflow-hidden rounded-2xl p-4 shadow-xs"
                  style={{ borderLeft: `5px solid ${subjectColor(task.subject_id)}` }}
                >
                  <div className="flex flex-1 items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => toggleComplete(task)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        task.status === "completed"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-ink-faint/40 hover:border-teal-500"
                      }`}
                      aria-label="Toggle completion"
                    >
                      {task.status === "completed" && <CheckSquare size={13} />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`font-display text-sm font-semibold ${
                            task.status === "completed" ? "text-ink-faint line-through" : "text-ink"
                          }`}
                        >
                          {task.title}
                        </p>
                        {subjectName(task.subject_id) && (
                          <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                            {subjectName(task.subject_id)}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-ink-faint" />
                          {task.deadline_at
                            ? new Date(task.deadline_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "No deadline"}
                        </span>
                        <span>·</span>
                        <span>{task.estimated_minutes} min</span>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusBadgeClasses(
                            task.status,
                            task.priority,
                            task.deadline_at
                          )}`}
                        >
                          {statusLabel(task.status, task.deadline_at)}
                        </span>
                        {task.priority >= 4 && !task.status.includes("completed") && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-600">
                            <Sparkles size={10} /> Priority {task.priority}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 pl-2">
                    <button
                      onClick={() => startEdit(task)}
                      className="rounded-lg border border-ink/10 bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-paper-dim"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
