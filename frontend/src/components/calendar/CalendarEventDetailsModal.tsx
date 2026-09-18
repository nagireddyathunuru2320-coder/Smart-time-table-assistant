"use client";

import { useState } from "react";
import {
  Clock,
  MapPin,
  AlignLeft,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Flag,
} from "lucide-react";
import type { CalendarEvent } from "@/lib/calendar-api";
import { EVENT_TYPE_OPTIONS } from "./CalendarEventModal";

export interface CalendarEventDetailsModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: number) => Promise<void>;
}

function formatEventDates(event: CalendarEvent): string {
  try {
    const s = new Date(event.start_at);
    const e = new Date(event.end_at);

    if (event.all_day) {
      return s.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + " (All Day)";
    }

    const dateStr = s.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const timeStart = s.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const timeEnd = e.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    // Calculate duration in hours/mins
    const diffMs = e.getTime() - s.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const durationStr =
      hours > 0
        ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}`
        : `${mins} mins`;

    return `${dateStr} • ${timeStart} – ${timeEnd} (${durationStr})`;
  } catch {
    return `${event.start_at} – ${event.end_at}`;
  }
}

export function CalendarEventDetailsModal({
  isOpen,
  event,
  onClose,
  onEdit,
  onDelete,
}: CalendarEventDetailsModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const category =
    EVENT_TYPE_OPTIONS.find((opt) => opt.value === event.event_type) ?? {
      value: "other",
      label: event.event_type || "Event",
      color: "#9BA3B4",
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
    };

  async function handleDelete() {
    if (!event) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(event.id);
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete event");
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header with color accent bar */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: category.color }}
        />

        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `${category.color}15`,
                color: category.color,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.label}
            </span>

            {event.source === "study_plan" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                <Sparkles size={11} />
                AI Generated
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-2 gap-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Time */}
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <Clock size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <span className="font-medium leading-relaxed">{formatEventDates(event)}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <span className="font-medium leading-relaxed">{event.location}</span>
            </div>
          )}

          {/* Priority */}
          {event.priority && event.priority > 0 && (
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <Flag size={15} className="text-slate-400 shrink-0" />
              <span className="font-medium">
                Priority:{" "}
                <span
                  className={
                    event.priority >= 4
                      ? "text-rose-600 font-semibold"
                      : event.priority === 3
                      ? "text-amber-600 font-semibold"
                      : "text-teal-600 font-semibold"
                  }
                >
                  {event.priority >= 4
                    ? "High"
                    : event.priority === 3
                    ? "Medium"
                    : "Low"}
                </span>
              </span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                <AlignLeft size={13} className="text-slate-400" />
                <span>Notes & Description</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Delete confirmation alert if triggered */}
          {confirmDelete && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-bold mb-1">
                <AlertTriangle size={15} className="text-rose-600" />
                <span>Delete Event?</span>
              </div>
              <p className="text-xs text-rose-700 mb-3">
                Are you sure you want to remove &ldquo;{event.title}&rdquo; from your calendar? This action cannot be undone.
              </p>
              {deleteError && (
                <p className="text-xs text-rose-600 font-medium mb-2">{deleteError}</p>
              )}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteError(null);
                  }}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!confirmDelete && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="btn-specular flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:shadow-md transition-all"
              >
                <Pencil size={13} />
                <span>Edit Event</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
