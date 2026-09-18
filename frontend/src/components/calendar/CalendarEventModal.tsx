"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  X,
  Loader2,
  Check,
  Flag,
} from "lucide-react";
import type { CalendarEvent, CalendarEventInput } from "@/lib/calendar-api";

export const EVENT_TYPE_OPTIONS = [
  {
    value: "study_block",
    label: "Study Session",
    color: "#14B8A6",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
  },
  {
    value: "academic",
    label: "Class / Academic",
    color: "#6C8CFF",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  {
    value: "exam",
    label: "Exam / Quiz",
    color: "#FB7185",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  {
    value: "task_block",
    label: "Task / Assignment",
    color: "#FBBF24",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  {
    value: "personal",
    label: "Personal",
    color: "#22D3EE",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  {
    value: "other",
    label: "Other",
    color: "#9BA3B4",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
] as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDatetimeLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CalendarEventInput) => Promise<void>;
  initialData?: Partial<CalendarEvent> | null;
  defaultStart?: Date;
  defaultEnd?: Date;
  defaultAllDay?: boolean;
}

function CalendarEventModalForm({
  onClose,
  onSave,
  initialData,
  defaultStart,
  defaultEnd,
  defaultAllDay,
}: Omit<CalendarEventModalProps, "isOpen">) {
  const isEditing = Boolean(initialData?.id);

  const initialStart = initialData?.start_at
    ? new Date(initialData.start_at)
    : defaultStart
    ? new Date(defaultStart)
    : (() => {
        const n = new Date();
        n.setMinutes(n.getMinutes() > 30 ? 60 : 30, 0, 0);
        return n;
      })();

  const initialEnd = initialData?.end_at
    ? new Date(initialData.end_at)
    : defaultEnd
    ? new Date(defaultEnd)
    : new Date(initialStart.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [eventType, setEventType] = useState(initialData?.event_type ?? "study_block");
  const [allDay, setAllDay] = useState(Boolean(initialData?.all_day ?? defaultAllDay));
  const [startDatetime, setStartDatetime] = useState(toDatetimeLocal(initialStart));
  const [endDatetime, setEndDatetime] = useState(toDatetimeLocal(initialEnd));
  const [startDateOnly, setStartDateOnly] = useState(toDateOnly(initialStart));
  const [endDateOnly, setEndDateOnly] = useState(toDateOnly(initialEnd));
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [priority, setPriority] = useState<number>(initialData?.priority ?? 3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please provide an event title");
      return;
    }

    let startIso: string;
    let endIso: string;

    if (allDay) {
      if (!startDateOnly) {
        setError("Please choose a start date");
        return;
      }
      const effectiveEndDate = endDateOnly || startDateOnly;
      const s = new Date(`${startDateOnly}T00:00:00`);
      const e = new Date(`${effectiveEndDate}T23:59:59`);
      if (e <= s) {
        setError("End date must be on or after start date");
        return;
      }
      startIso = s.toISOString();
      endIso = e.toISOString();
    } else {
      if (!startDatetime || !endDatetime) {
        setError("Please specify both start and end time");
        return;
      }
      const s = new Date(startDatetime);
      const e = new Date(endDatetime);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        setError("Invalid date or time entered");
        return;
      }
      if (e <= s) {
        setError("End time must be strictly after start time");
        return;
      }
      startIso = s.toISOString();
      endIso = e.toISOString();
    }

    setSubmitting(true);
    try {
      await onSave({
        title: trimmedTitle,
        event_type: eventType,
        all_day: allDay,
        start_at: startIso,
        end_at: endIso,
        location: location.trim() || null,
        description: description.trim() || null,
        priority,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save calendar event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-gradient-to-r from-slate-50/70 to-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-sm text-white">
              <Calendar size={18} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-slate-800">
                {isEditing ? "Edit Calendar Event" : "New Calendar Event"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Update your schedule details"
                  : "Add a study session, class, or task"}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-5 gap-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Organic Chemistry Review, Math Lecture"
              className="glass-input w-full px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENT_TYPE_OPTIONS.map((opt) => {
                const isSelected = eventType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEventType(opt.value)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? "border-sky-500 bg-sky-50/80 text-sky-900 shadow-xs ring-1 ring-sky-400/40 font-semibold"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-3 border border-slate-100">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <div>
                <span className="text-xs font-semibold text-slate-700">All-day event</span>
                <p className="text-[11px] text-slate-500">Event spans full days with no specific time</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500" />
            </label>
          </div>

          {/* Date & Time Selectors */}
          {allDay ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDateOnly}
                  onChange={(e) => setStartDateOnly(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">End Date</label>
                <input
                  type="date"
                  required
                  value={endDateOnly}
                  onChange={(e) => setEndDateOnly(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Starts At</label>
                <input
                  type="datetime-local"
                  required
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Ends At</label>
                <input
                  type="datetime-local"
                  required
                  value={endDatetime}
                  onChange={(e) => setEndDatetime(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <MapPin size={13} className="text-slate-400" />
              Location (optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Library, Room 302, Zoom"
              className="glass-input w-full px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <AlignLeft size={13} className="text-slate-400" />
              Notes / Description (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details, key concepts to cover, or reminders..."
              className="glass-input w-full px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Flag size={13} className="text-slate-400" />
              Priority
            </label>
            <div className="flex gap-2">
              {[
                { level: 2, label: "Low", badge: "badge-low" },
                { level: 3, label: "Medium", badge: "badge-medium" },
                { level: 5, label: "High", badge: "badge-high" },
              ].map((p) => (
                <button
                  key={p.level}
                  type="button"
                  onClick={() => setPriority(p.level)}
                  className={`flex-1 rounded-xl py-1.5 text-xs font-medium border transition-all text-center ${
                    priority === p.level
                      ? `${p.badge} border-current font-bold ring-1 ring-current/30`
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="mt-2 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-specular flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{isEditing ? "Update Event" : "Create Event"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CalendarEventModal(props: CalendarEventModalProps) {
  if (!props.isOpen) return null;
  // Key ensures a fresh mount with updated initialData/defaults every time it opens
  const formKey = props.initialData?.id
    ? `edit-${props.initialData.id}`
    : `new-${props.defaultStart?.getTime() ?? "now"}`;
  return <CalendarEventModalForm key={formKey} {...props} />;
}
