"use client";

import { useState } from "react";
import {
  type Exam,
  type ExamInput,
  createExam,
  updateExam,
  deleteExam,
} from "@/lib/academic-api";
import type { Subject } from "@/lib/academic-api";
import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const EMPTY_FORM: ExamInput = {
  subject_id: null,
  title: "",
  exam_at: "",
  duration_minutes: 120,
  location: "",
  difficulty: 3,
  priority: 5,
  study_required_minutes: 360,
  notes: "",
};

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function countdownBadge(iso: string): { text: string; classes: string } {
  const days = daysUntil(iso);
  if (days < 0) return { text: "Past", classes: "bg-paper-dim text-ink-faint" };
  if (days === 0) return { text: "Today", classes: "bg-brick-light text-brick" };
  if (days <= 3) return { text: `${days}d left`, classes: "bg-brick-light text-brick" };
  if (days <= 7) return { text: `${days}d left`, classes: "bg-brass-light/50 text-ink" };
  return { text: `${days}d left`, classes: "bg-forest-light text-forest" };
}

export function ExamManager({
  initialExams,
  subjects,
}: {
  initialExams: Exam[];
  subjects: Subject[];
}) {
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [form, setForm] = useState<ExamInput>(EMPTY_FORM);
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

  function startEdit(exam: Exam) {
    setEditingId(exam.id);
    setForm({
      subject_id: exam.subject_id,
      title: exam.title,
      exam_at: toDatetimeLocal(exam.exam_at),
      duration_minutes: exam.duration_minutes,
      location: exam.location ?? "",
      difficulty: exam.difficulty,
      priority: exam.priority,
      study_required_minutes: exam.study_required_minutes,
      notes: exam.notes ?? "",
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

    const payload: ExamInput = {
      ...form,
      exam_at: form.exam_at ? new Date(form.exam_at).toISOString() : form.exam_at,
      location: form.location || null,
      notes: form.notes || null,
    };

    try {
      if (editingId !== null) {
        const updated = await updateExam(editingId, payload);
        setExams((prev) => prev.map((ex) => (ex.id === editingId ? updated : ex)));
      } else {
        const created = await createExam(payload);
        setExams((prev) => [...prev, created]);
      }
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Delete this exam?");
    if (!confirmed) return;

    setError(null);
    try {
      await deleteExam(id);
      setExams((prev) => prev.filter((ex) => ex.id !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete exam");
    }
  }

  const sortedExams = [...exams].sort(
    (a, b) => new Date(a.exam_at).getTime() - new Date(b.exam_at).getTime(),
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">
            {editingId !== null ? "Edit exam" : "New exam"}
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
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Date & time</label>
            <input type="datetime-local" required value={form.exam_at} onChange={(e) => setForm({ ...form, exam_at: e.target.value })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Duration (min)</label>
              <input type="number" min={1} max={1440} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Location</label>
              <input type="text" value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Study time needed (minutes)</label>
            <input type="number" min={0} max={10080} value={form.study_required_minutes} onChange={(e) => setForm({ ...form, study_required_minutes: Number(e.target.value) })} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Notes</label>
            <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy" />
          </div>
          {error && <p className="rounded-md bg-brick-light px-3 py-2 text-sm text-brick">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-50">
              {submitting ? "Saving..." : editingId !== null ? "Save changes" : "Add exam"}
            </button>
            {editingId !== null && <button type="button" onClick={cancelEdit} className="rounded-md border border-ink-faint/25 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper-dim">Cancel</button>}
          </div>
        </form>
      </div>
      <div className="lg:col-span-2">
        {sortedExams.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No exams yet!" description="Add your first exam to get started." />
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedExams.map((exam) => {
              const badge = countdownBadge(exam.exam_at);
              return (
                <li key={exam.id} className="glass-panel flex items-start justify-between overflow-hidden rounded-2xl shadow-sm" style={{ borderLeft: `5px solid ${subjectColor(exam.subject_id)}` }}>
                  <div className="flex-1 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-medium text-ink">{exam.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.classes}`}>{badge.text}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-ink-soft">
                      {new Date(exam.exam_at).toLocaleString()} · {exam.duration_minutes} min
                      {exam.location ? ` · ${exam.location}` : ""}
                      {subjectName(exam.subject_id) ? ` · ${subjectName(exam.subject_id)}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{exam.study_required_minutes} min of study recommended</p>
                  </div>
                  <div className="flex gap-2 px-5 py-4">
                    <button onClick={() => startEdit(exam)} className="rounded-md border border-ink-faint/25 px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-dim">Edit</button>
                    <button onClick={() => handleDelete(exam.id)} className="rounded-md border border-brick/30 px-3 py-1.5 text-sm text-brick hover:bg-brick-light">Delete</button>
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
