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
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display mb-2 text-2xl font-semibold text-ink">Conflicts</h1>
        <p className="mb-6 text-ink-soft">
          Overlapping events in your calendar are flagged here automatically.
        </p>
        <ConflictList initialConflicts={conflicts} />
      </div>
    </div>
  );
}

