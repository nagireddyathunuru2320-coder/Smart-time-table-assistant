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
    <div className="flex-1 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Calendar</h1>
            <p className="mt-1 text-xs text-ink-soft">
              Organize your study schedule and never miss an important date.
            </p>
          </div>
          <GenerateStudyPlanButton variant="compact" />
        </div>
        <CalendarPageContent events={events} />
      </div>
    </div>
  );
}