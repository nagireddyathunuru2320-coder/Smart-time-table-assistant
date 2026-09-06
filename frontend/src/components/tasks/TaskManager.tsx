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
import { CheckSquare } from "lucide-react";
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

function statusBadgeClasses(status: string, deadline: string | null): string {
  const overdue = deadline && new Date(deadline) < new Date() && status !== "completed";
  if (overdue) return "bg-brick-light text-brick";
  if (status === "completed") return "bg-forest-light text-forest";
  if (status === "in_progress") return "bg-brass-light/50 text-ink";
  return "bg-paper-dim text-ink-soft";
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
      description: form.description || null,
      deadline_at: form.deadline_at ? new Date(form.deadline_at).toISOString() : null,
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

  async function toggleComplete(task: Task) {
    setError(null);
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    try {
      const updated = await updateTask(task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update task");
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.deadline_at) return 1;
    if (!b.deadline_at) return -1;
    return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">
            {editingId !== null ? "Edit task" : "New task"}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Subject</label>
            <select value={form.subject_id ?? ""} onChange={(e) => setForm({ ...form, subject_id: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy">
              <option value="">No subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Type</label>
              <select value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy">
                {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Est. minutes</label>
              <input type="number" min={1} max={10080} value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Deadline</label>
            <input type="datetime-local" value={form.deadline_at ?? ""} onChange={(e) => setForm({ ...form, deadline_at: e.target.value })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Description</label>
            <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
          {error && <p className="rounded-md bg-brick-light px-3 py-2 text-sm text-brick">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-50">
              {submitting ? "Saving..." : editingId !== null ? "Save changes" : "Add task"}
            </button>
            {editingId !== null && <button type="button" onClick={cancelEdit} className="rounded-md border border-ink-faint/25 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper-dim">Cancel</button>}
          </div>
        </form>
      </div>
      <div className="lg:col-span-2">
        {sortedTasks.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No tasks yet!" description="Add your first task to get started." />
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedTasks.map((task) => (
              <li key={task.id} className="glass-panel flex items-start justify-between overflow-hidden rounded-2xl shadow-sm" style={{ borderLeft: `5px solid ${subjectColor(task.subject_id)}` }}>
                <div className="flex flex-1 items-start gap-3 px-5 py-4">
                  <input type="checkbox" checked={task.status === "completed"} onChange={() => toggleComplete(task)} className="mt-1 h-4 w-4 accent-navy" />
                  <div>
                    <p className={`font-display font-medium ${task.status === "completed" ? "text-ink-faint line-through" : "text-ink"}`}>
                      {task.title}
                      {subjectName(task.subject_id) && <span className="ml-2 text-xs font-normal text-ink-faint">{subjectName(task.subject_id)}</span>}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-ink-soft">
                      {task.deadline_at ? new Date(task.deadline_at).toLocaleString() : "No deadline"} · {task.estimated_minutes} min · priority {task.priority}/5
                    </p>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(task.status, task.deadline_at)}`}>{statusLabel(task.status, task.deadline_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2 px-5 py-4">
                  <button onClick={() => startEdit(task)} className="rounded-md border border-ink-faint/25 px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-dim">Edit</button>
                  <button onClick={() => handleDelete(task.id)} className="rounded-md border border-brick/30 px-3 py-1.5 text-sm text-brick hover:bg-brick-light">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
