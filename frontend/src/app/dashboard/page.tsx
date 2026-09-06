import { redirect } from "next/navigation";
import { getSessionToken, backendUrl } from "@/lib/session";
import { GenerateStudyPlanButton } from "@/components/schedule/GenerateStudyPlanButton";
import type { User } from "@/lib/types";

async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const response = await fetch(backendUrl("/auth/me"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json();
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Dashboard</p>
        <h1 className="font-display mt-1 text-3xl font-semibold text-ink">
          Welcome back, {user.full_name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-ink-soft">
          Your subjects, tasks, and calendar are all set up. Jump in using the links above.
        </p>

        <div className="mt-8">
          <GenerateStudyPlanButton />
        </div>
      </div>
    </div>
  );
}