"use client";

import { useState } from "react";
import {
  type Subject,
  type SubjectInput,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/lib/academic-api";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const EMPTY_FORM: SubjectInput = {
  name: "",
  code: "",
  color: "#2B3A55",
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
      <div className="lg:col-span-1">
        <form
          onSubmit={handleSubmit}
          className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="font-display text-lg font-semibold text-ink">
            {editingId !== null ? "Edit subject" : "New subject"}
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Code</label>
            <input
              type="text"
              value={form.code ?? ""}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. CS101"
              className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Instructor</label>
            <input
              type="text"
              value={form.instructor ?? ""}
              onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Color</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-10 w-full rounded-md border border-ink-faint/25"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
                className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Weekly target (minutes)
            </label>
            <input
              type="number"
              min={0}
              max={10080}
              value={form.weekly_target_minutes}
              onChange={(e) =>
                setForm({ ...form, weekly_target_minutes: Number(e.target.value) })
              }
              className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Notes</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-ink-faint/25 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-navy"
            />
          </div>

          {error && <p className="rounded-md bg-brick-light px-3 py-2 text-sm text-brick">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingId !== null ? "Save changes" : "Add subject"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md border border-ink-faint/25 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper-dim"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="lg:col-span-2">
        {subjects.length === 0 ? (
          <EmptyState icon={BookOpen} title="No subjects yet!" description="Add your first subject to get started." />
        ) : (
          <ul className="flex flex-col gap-3">
            {subjects.map((subject) => (
              <li
                key={subject.id}
                className="glass-panel flex items-center justify-between overflow-hidden rounded-2xl shadow-sm"
                style={{ borderLeft: `5px solid ${subject.color}` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <p className="font-display font-medium text-ink">
                      {subject.name}
                      {subject.code && (
                        <span className="ml-2 font-mono text-xs font-normal text-ink-faint">
                          {subject.code}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {subject.instructor ? `${subject.instructor} · ` : ""}
                      Difficulty {subject.difficulty}/5 · {subject.weekly_target_minutes} min/week
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(subject)}
                    className="rounded-md border border-ink-faint/25 px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-dim"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="rounded-md border border-brick/30 px-3 py-1.5 text-sm text-brick hover:bg-brick-light"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
