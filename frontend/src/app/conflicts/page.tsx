import { redirect } from "next/navigation";
import { getSessionToken, backendUrl } from "@/lib/session";
import { ConflictList } from "@/components/conflicts/ConflictList";
import type { Conflict } from "@/lib/conflicts-api";

async function getInitialConflicts(): Promise<Conflict[] | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const response = await fetch(backendUrl("/conflicts"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return [];
  return response.json();
}

export default async function ConflictsPage() {
  const conflicts = await getInitialConflicts();

  if (conflicts === null) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Conflicts</h1>
          <p className="mt-1 text-xs text-ink-soft">
            View and resolve any schedule conflicts or clashes in your timetable.
          </p>
        </div>
        <ConflictList initialConflicts={conflicts} />
      </div>
    </div>
  );
}
