import { redirect } from "next/navigation";
import { getSessionToken, backendUrl } from "@/lib/session";
import { SubjectManager } from "@/components/subjects/SubjectManager";
import type { Subject } from "@/lib/academic-api";

async function getInitialSubjects(): Promise<Subject[] | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const response = await fetch(backendUrl("/subjects"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return [];
  return response.json();
}

export default async function SubjectsPage() {
  const subjects = await getInitialSubjects();

  if (subjects === null) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Subjects</h1>
          <p className="mt-1 text-xs text-ink-soft">Manage your subjects and study materials.</p>
        </div>
        <SubjectManager initialSubjects={subjects} />
      </div>
    </div>
  );
}
