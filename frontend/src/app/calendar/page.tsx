import { redirect } from "next/navigation";
import { getSessionToken, backendUrl } from "@/lib/session";
import { CalendarPageContent } from "@/components/calendar/CalendarPageContent";
import { GenerateStudyPlanButton } from "@/components/schedule/GenerateStudyPlanButton";
import type { CalendarEvent } from "@/lib/calendar-api";

async function getInitialEvents(): Promise<CalendarEvent[] | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const response = await fetch(backendUrl("/calendar-events"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return [];
  return response.json();
}

export default async function CalendarPage() {
  const events = await getInitialEvents();

  if (events === null) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-ink">Calendar</h1>
          <GenerateStudyPlanButton variant="compact" />
        </div>
        <CalendarPageContent events={events} />
      </div>
    </div>
  );
}