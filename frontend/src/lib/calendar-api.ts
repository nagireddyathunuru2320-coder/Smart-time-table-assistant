export interface CalendarEvent {
  id: number;
  user_id: number;
  calendar_account_id: number | null;
  title: string;
  description: string | null;
  location: string | null;
  event_type: string;
  start_at: string;
  end_at: string;
  timezone: string;
  all_day: boolean;
  rrule: string | null;
  recurrence_exception: string | null;
  parent_event_id: number | null;
  source: string;
  priority: number;
  is_busy: boolean;
  external_event_id: string | null;
}

export interface CalendarEventInput {
  title: string;
  description?: string | null;
  location?: string | null;
  event_type?: string;
  start_at: string;
  end_at: string;
  timezone?: string;
  all_day?: boolean;
  priority?: number;
  is_busy?: boolean;
}

async function parseOrThrow(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail.map((d: { msg: string }) => d.msg).join(", ")
      : data.detail ?? "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await fetch("/api/calendar-events", { cache: "no-store" });
  return parseOrThrow(response);
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<CalendarEvent> {
  const response = await fetch("/api/calendar-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}

export async function updateCalendarEvent(
  id: number,
  input: Partial<CalendarEventInput>,
): Promise<CalendarEvent> {
  const response = await fetch(`/api/calendar-events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  const response = await fetch(`/api/calendar-events/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? "Delete failed");
  }
}