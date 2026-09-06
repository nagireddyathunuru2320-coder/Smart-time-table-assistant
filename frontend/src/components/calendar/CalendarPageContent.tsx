"use client";

import dynamic from "next/dynamic";
import type { CalendarEvent } from "@/lib/calendar-api";

const CalendarView = dynamic(() => import("./CalendarView").then(mod => ({ default: mod.CalendarView })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8 text-zinc-600">Loading calendar...</div>,
});

export function CalendarPageContent({ events }: { events: CalendarEvent[] }) {
  return <CalendarView initialEvents={events} />;
}
