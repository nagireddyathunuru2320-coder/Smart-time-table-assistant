"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg } from "@fullcalendar/core";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import {
  type CalendarEvent,
  type CalendarEventInput,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/calendar-api";
import { CalendarEventModal, EVENT_TYPE_OPTIONS } from "./CalendarEventModal";
import { CalendarEventDetailsModal } from "./CalendarEventDetailsModal";

const EVENT_TYPE_COLORS: Record<string, string> = {
  academic: "#6C8CFF",
  study_block: "#14B8A6",
  personal: "#22D3EE",
  exam: "#FB7185",
  task_block: "#FBBF24",
  other: "#9BA3B4",
};

function toFullCalendarEvent(event: CalendarEvent) {
  const color = EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.other;
  return {
    id: String(event.id),
    title: event.title,
    start: event.start_at,
    end: event.end_at,
    allDay: event.all_day,
    backgroundColor: color,
    borderColor: color,
    extendedProps: { raw: event },
  };
}

export function CalendarView({ initialEvents }: { initialEvents: CalendarEvent[] }) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultStart, setDefaultStart] = useState<Date | undefined>(undefined);
  const [defaultEnd, setDefaultEnd] = useState<Date | undefined>(undefined);
  const [defaultAllDay, setDefaultAllDay] = useState<boolean | undefined>(undefined);

  // Details modal states
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents(initialEvents);
  }, [initialEvents]);

  const refetchAndReplace = useCallback(
    (updater: (prev: CalendarEvent[]) => CalendarEvent[]) => {
      setEvents(updater);
    },
    [],
  );

  // Tapping a date (mobile) or clicking an empty date cell (desktop)
  function handleDateClick(arg: DateClickArg) {
    setEditingEvent(null);
    const s = new Date(arg.date);
    const e = new Date(s);

    if (arg.allDay) {
      s.setHours(9, 0, 0, 0);
      e.setHours(10, 0, 0, 0);
      setDefaultAllDay(true);
    } else {
      e.setHours(s.getHours() + 1);
      setDefaultAllDay(false);
    }

    setDefaultStart(s);
    setDefaultEnd(e);
    setIsFormModalOpen(true);
  }

  // Dragging / selecting a time range on desktop or tablet
  function handleSelect(selection: DateSelectArg) {
    selection.view.calendar.unselect();
    setEditingEvent(null);
    setDefaultStart(selection.start);
    setDefaultEnd(selection.end);
    setDefaultAllDay(selection.allDay);
    setIsFormModalOpen(true);
  }

  // Clicking an existing event -> opens rich details modal instead of native confirm
  function handleEventClick(clickInfo: EventClickArg) {
    const raw = clickInfo.event.extendedProps?.raw as CalendarEvent | undefined;
    if (raw) {
      setSelectedEvent(raw);
      setIsDetailsModalOpen(true);
    }
  }

  // Drag-and-drop rescheduling
  async function handleEventDrop(dropInfo: EventDropArg) {
    const eventId = Number(dropInfo.event.id);
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;
    if (!newStart) return;

    // If end is missing, compute default 1-hour or keep duration
    const raw = dropInfo.event.extendedProps?.raw as CalendarEvent | undefined;
    let computedEnd = newEnd;
    if (!computedEnd && raw) {
      const origStart = new Date(raw.start_at).getTime();
      const origEnd = new Date(raw.end_at).getTime();
      const diff = Math.max(origEnd - origStart, 3600000);
      computedEnd = new Date(newStart.getTime() + diff);
    } else if (!computedEnd) {
      computedEnd = new Date(newStart.getTime() + 3600000);
    }

    setError(null);
    try {
      const updated = await updateCalendarEvent(eventId, {
        start_at: newStart.toISOString(),
        end_at: computedEnd.toISOString(),
        all_day: dropInfo.event.allDay,
      });
      refetchAndReplace((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    } catch (err) {
      dropInfo.revert();
      setError(err instanceof Error ? err.message : "Could not move event");
    }
  }

  // Create or Update event submit handler
  async function handleSaveEvent(payload: CalendarEventInput) {
    setError(null);
    if (editingEvent) {
      const updated = await updateCalendarEvent(editingEvent.id, payload);
      refetchAndReplace((prev) =>
        prev.map((e) => (e.id === editingEvent.id ? updated : e)),
      );
    } else {
      const created = await createCalendarEvent(payload);
      refetchAndReplace((prev) => [...prev, created]);
    }
  }

  // Delete event handler
  async function handleDeleteEvent(eventId: number) {
    setError(null);
    await deleteCalendarEvent(eventId);
    refetchAndReplace((prev) => prev.filter((e) => e.id !== eventId));
  }

  // Open edit modal from details modal
  function handleEditFromDetails(event: CalendarEvent) {
    setIsDetailsModalOpen(false);
    setSelectedEvent(null);
    setEditingEvent(event);
    setDefaultStart(new Date(event.start_at));
    setDefaultEnd(new Date(event.end_at));
    setDefaultAllDay(event.all_day);
    setIsFormModalOpen(true);
  }

  // Primary "+ New Event" button handler
  function handleAddNewClick() {
    setEditingEvent(null);
    const now = new Date();
    now.setMinutes(now.getMinutes() > 30 ? 60 : 30, 0, 0);
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setDefaultStart(now);
    setDefaultEnd(later);
    setDefaultAllDay(false);
    setIsFormModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 animate-in fade-in">
          {error}
        </div>
      )}

      {/* Action Bar with Quick Add Button and Categories Legend */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Categories chips (scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {EVENT_TYPE_OPTIONS.slice(0, 5).map((t) => (
            <span
              key={t.value}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200/80 shadow-2xs"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <span>{t.label}</span>
            </span>
          ))}
        </div>

        {/* New Event Button */}
        <button
          type="button"
          onClick={handleAddNewClick}
          className="btn-specular inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:shadow-lg transition-all"
        >
          <Plus size={16} />
          <span>Add Event</span>
        </button>
      </div>

      {/* Main Calendar Shell */}
      <div className="calendar-shell glass-panel rounded-2xl p-3 sm:p-5 shadow-xs border border-white/80">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          contentHeight="auto"
          aspectRatio={1.4}
          expandRows
          selectable
          selectMirror
          unselectAuto
          longPressDelay={250}
          eventLongPressDelay={250}
          selectLongPressDelay={250}
          dateClick={handleDateClick}
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          events={events.map(toFullCalendarEvent)}
          dayMaxEvents={3}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
        />
      </div>

      {/* Helpful hint text */}
      <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
        <CalendarIcon size={14} className="text-slate-400 shrink-0" />
        <p>
          <span className="font-semibold text-slate-700">Quick tip:</span> Tap or click any date to add a session. Click any event to view details, edit, or remove it.
        </p>
      </div>

      {/* Event Form Modal (Create / Edit) */}
      <CalendarEventModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        initialData={editingEvent}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        defaultAllDay={defaultAllDay}
      />

      {/* Event Details Modal */}
      <CalendarEventDetailsModal
        isOpen={isDetailsModalOpen}
        event={selectedEvent}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
