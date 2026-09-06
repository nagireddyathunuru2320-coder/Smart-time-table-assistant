"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg } from "@fullcalendar/core";
import {
  type CalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/calendar-api";

const EVENT_TYPE_COLORS: Record<string, string> = {
  academic: "#6C8CFF",
  study_block: "#34D399",
  personal: "#22D3EE",
  exam: "#FB7185",
  task_block: "#FBBF24",
  other: "#9BA3B4",
};

function toFullCalendarEvent(event: CalendarEvent) {
  return {
    id: String(event.id),
    title: event.title,
    start: event.start_at,
    end: event.end_at,
    allDay: event.all_day,
    backgroundColor: EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.other,
    borderColor: EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.other,
    extendedProps: { raw: event },
  };
}

export function CalendarView({ initialEvents }: { initialEvents: CalendarEvent[] }) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  // CalendarView only receives a fresh initialEvents array when the parent
  // server component re-renders (e.g. via router.refresh() after
  // generating a study plan). Without this effect, this component's local
  // state would silently keep showing the stale snapshot from first load.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents(initialEvents);
  }, [initialEvents]);

  const refetchAndReplace = useCallback((updater: (prev: CalendarEvent[]) => CalendarEvent[]) => {
    setEvents(updater);
  }, []);

  async function handleSelect(selection: DateSelectArg) {
    const title = window.prompt("Event title");
    selection.view.calendar.unselect();
    if (!title) return;

    setError(null);
    try {
      const created = await createCalendarEvent({
        title,
        start_at: selection.start.toISOString(),
        end_at: selection.end.toISOString(),
        all_day: selection.allDay,
        event_type: "personal",
      });
      refetchAndReplace((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
    }
  }

  async function handleEventClick(clickInfo: EventClickArg) {
    const eventId = Number(clickInfo.event.id);
    const shouldDelete = window.confirm(`Delete "${clickInfo.event.title}"?`);
    if (!shouldDelete) return;

    setError(null);
    try {
      await deleteCalendarEvent(eventId);
      refetchAndReplace((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete event");
    }
  }

  async function handleEventDrop(dropInfo: EventDropArg) {
    const eventId = Number(dropInfo.event.id);
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;
    if (!newStart || !newEnd) return;

    setError(null);
    try {
      const updated = await updateCalendarEvent(eventId, {
        start_at: newStart.toISOString(),
        end_at: newEnd.toISOString(),
      });
      refetchAndReplace((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    } catch (err) {
      dropInfo.revert();
      setError(err instanceof Error ? err.message : "Could not move event");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="glass-panel rounded-lg p-4 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          selectable
          editable
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          events={events.map(toFullCalendarEvent)}
        />
      </div>
      <p className="text-xs text-zinc-500">
        Click and drag on the calendar to create an event. Click an event to delete it. Drag an
        event to reschedule it.
      </p>
    </div>
  );
}
