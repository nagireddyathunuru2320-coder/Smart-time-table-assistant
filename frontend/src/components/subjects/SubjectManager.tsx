"use client";

import { useState } from "react";
import {
  type Subject,
  type SubjectInput,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/lib/academic-api";
import { BookOpen, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const EMPTY_FORM: SubjectInput = {
  name: "",
  code: "",
  color: "#14B8A6",
  instructor: "",
  difficulty: 3,
  weekly_target_minutes: 180,
  notes: "",
};

export function SubjectManager({ initialSubjects }: { initialSubjects: Subject[] }) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [form, setForm] = useState<SubjectInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function startEdit(subject: Subject) {
    setEditingId(subject.id);
    setForm({
      name: subject.name,
      code: subject.code ?? "",
      color: subject.color,
      instructor: subject.instructor ?? "",
      difficulty: subject.difficulty,
      weekly_target_minutes: subject.weekly_target_minutes,
      notes: subject.notes ?? "",
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

    const payload: SubjectInput = {
      ...form,
      code: form.code || null,
      instructor: form.instructor || null,
      notes: form.notes || null,
    };

    try {
      if (editingId !== null) {
        const updated = await updateSubject(editingId, payload);
        setSubjects((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const created = await createSubject(payload);
        setSubjects((prev) => [...prev, created]);
      }
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Delete this subject? Tasks and exams linked to it may be affected.");
    if (!confirmed) return;

    setError(null);
    try {
      await deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete subject");
    }
  }

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
              {editingId !== null ? "Edit Subject" : "New Subject"}
            </h2>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mathematics"
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Code</label>
            <input
              type="text"
              value={form.code ?? ""}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. MATH101"
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Instructor</label>
            <input
              type="text"
              value={form.instructor ?? ""}
              onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              placeholder="e.g. Dr. Smith"
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Color</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 w-full cursor-pointer rounded-xl border border-ink-faint/25 bg-white p-1"
              />
            </div>
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
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Weekly Target (minutes)
            </label>
            <input
              type="number"
              min={0}
              max={10080}
              value={form.weekly_target_minutes}
              onChange={(e) =>
                setForm({ ...form, weekly_target_minutes: Number(e.target.value) })
              }
              className="glass-input w-full px-3.5 py-2 text-xs text-ink outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Notes</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Optional notes"
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
              {submitting ? "Saving..." : editingId !== null ? "Save Changes" : "Add Subject"}
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

      {/* Right Grid Column of Subject Cards */}
      <div className="lg:col-span-2">
        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects yet!"
            description="Add your first subject to organize your curriculum and tracks."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Subjects">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="glass-panel flex flex-col justify-between rounded-3xl p-5 shadow-xs"
                style={{ borderTop: `4px solid ${subject.color}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: subject.color }}
                    >
                      <BookOpen size={18} />
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold text-ink">
                        {subject.name}
                      </p>
                      {subject.code && (
                        <p className="font-mono text-[11px] font-semibold text-ink-faint">
                          {subject.code}
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                <div className="mt-4 border-t border-ink/5 pt-3 text-xs text-ink-soft">
                  <p className="flex items-center justify-between">
                    <span>Target: {subject.weekly_target_minutes} min/wk</span>
                    <span className="font-semibold text-ink">
                      Diff {subject.difficulty}/5
                    </span>
                  </p>
                  {subject.instructor && (
                    <p className="mt-1 truncate text-[11px] text-ink-faint">
                      Prof: {subject.instructor}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => startEdit(subject)}
                    className="rounded-lg border border-ink/10 bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-paper-dim"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
