import { redirect } from "next/navigation";
import { getSessionToken, backendUrl } from "@/lib/session";
import { TaskManager } from "@/components/tasks/TaskManager";
import type { Task, Subject } from "@/lib/academic-api";

async function getInitialData(): Promise<{ tasks: Task[]; subjects: Subject[] } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const [tasksRes, subjectsRes] = await Promise.all([
    fetch(backendUrl("/tasks"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(backendUrl("/subjects"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  const tasks = tasksRes.ok ? await tasksRes.json() : [];
  const subjects = subjectsRes.ok ? await subjectsRes.json() : [];

  return { tasks, subjects };
}

export default async function TasksPage() {
  const data = await getInitialData();

  if (data === null) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display mb-6 text-2xl font-semibold text-ink">Tasks</h1>
        <TaskManager initialTasks={data.tasks} subjects={data.subjects} />
      </div>
    </div>
  );
}
