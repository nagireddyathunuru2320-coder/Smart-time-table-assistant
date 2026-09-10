import { redirect } from "next/navigation";
import { getSessionToken, backendUrl } from "@/lib/session";
import { ExamManager } from "@/components/exams/ExamManager";
import type { Exam, Subject } from "@/lib/academic-api";

async function getInitialData(): Promise<{ exams: Exam[]; subjects: Subject[] } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const [examsRes, subjectsRes] = await Promise.all([
    fetch(backendUrl("/exams"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(backendUrl("/subjects"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  const exams = examsRes.ok ? await examsRes.json() : [];
  const subjects = subjectsRes.ok ? await subjectsRes.json() : [];

  return { exams, subjects };
}

export default async function ExamsPage() {
  const data = await getInitialData();

  if (data === null) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Exams</h1>
          <p className="mt-1 text-xs text-ink-soft">Keep track of your upcoming exams and prepare effectively.</p>
        </div>
        <ExamManager initialExams={data.exams} subjects={data.subjects} />
      </div>
    </div>
  );
}
