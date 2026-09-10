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
import { GraduationCap, Plus, Calendar, MapPin, Clock } from "lucide-react";
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
  if (days < 0) return { text: "Past", classes: "badge-done" };
  if (days === 0) return { text: "Today", classes: "badge-high" };
  if (days <= 3) return { text: `In ${days} days`, classes: "badge-high" };
  if (days <= 7) return { text: `In ${days} days`, classes: "badge-medium" };
  return { text: `In ${days} days`, classes: "badge-low" };
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
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

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
      subject_id: form.subject_id ? Number(form.subject_id) : null,
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

  const upcomingCount = exams.filter((e) => daysUntil(e.exam_at) >= 0).length;
  const pastCount = exams.filter((e) => daysUntil(e.exam_at) < 0).length;

  const filteredExams = exams.filter((e) => {
    const d = daysUntil(e.exam_at);
    return tab === "upcoming" ? d >= 0 : d < 0;
  });

  const sortedExams = [...filteredExams].sort(
    (a, b) => new Date(a.exam_at).getTime() - new Date(b.exam_at).getTime()
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column Form */}
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
              {editingId !== null ? "Edit Exam" : "Add New Exam"}
            </h2>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Data Structures Final"
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
              <label className="mb-1 block text-xs font-semibold text-ink">Date & Time</label>
              <input
                type="datetime-local"
                required
                value={form.exam_at}
                onChange={(e) => setForm({ ...form, exam_at: e.target.value })}
                className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Duration (min)</label>
              <input
                type="number"
                min={1}
                max={1440}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Location</label>
            <input
              type="text"
              value={form.location ?? ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Room 101, Hall B (optional)"
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
                className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
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

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Study time needed (min)</label>
            <input
              type="number"
              min={0}
              max={10080}
              value={form.study_required_minutes}
              onChange={(e) => setForm({ ...form, study_required_minutes: Number(e.target.value) })}
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Notes</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Topics, formulas, or reminders"
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
              {submitting ? "Saving..." : editingId !== null ? "Save Changes" : "Add Exam"}
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

      {/* Right Column List */}
      <div className="lg:col-span-2">
        {/* Tab switcher */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-full border border-ink/5 bg-white/70 p-1 backdrop-blur-md">
            <button
              onClick={() => setTab("upcoming")}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                tab === "upcoming"
                  ? "gradient-accent text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setTab("past")}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                tab === "past"
                  ? "gradient-accent text-white shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Past ({pastCount})
            </button>
          </div>
        </div>

        {sortedExams.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={tab === "past" ? "No past exams recorded!" : "No upcoming exams!"}
            description="Add your midterms, finals, or quizzes to stay prepared."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedExams.map((exam) => {
              const badge = countdownBadge(exam.exam_at);
              return (
                <li
                  key={exam.id}
                  className="glass-panel flex items-start justify-between overflow-hidden rounded-2xl p-4 shadow-xs"
                  style={{ borderLeft: `5px solid ${subjectColor(exam.subject_id)}` }}
                >
                  <div className="flex flex-1 items-start gap-3.5">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: subjectColor(exam.subject_id) }}
                    >
                      <GraduationCap size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-sm font-bold text-ink">{exam.title}</p>
                        {subjectName(exam.subject_id) && (
                          <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                            {subjectName(exam.subject_id)}
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.classes}`}>
                          {badge.text}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-ink-faint" />
                          {new Date(exam.exam_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-ink-faint" />
                          {exam.duration_minutes} min
                        </span>
                        {exam.location && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-ink-faint" />
                              {exam.location}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="mt-2 text-[11px] text-ink-soft">
                        <span className="font-semibold text-ink">{exam.study_required_minutes} min</span> study recommended
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 pl-2">
                    <button
                      onClick={() => startEdit(exam)}
                      className="rounded-lg border border-ink/10 bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-paper-dim"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
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
