import { redirect } from "next/navigation";
import { getSessionToken, backendUrl } from "@/lib/session";
import { SettingsForm } from "@/components/settings/SettingsForm";
import type { User } from "@/lib/types";
import type { Preferences } from "@/lib/settings-api";

async function getInitialData(): Promise<{ user: User; preferences: Preferences } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const [userRes, prefRes] = await Promise.all([
    fetch(backendUrl("/users/me"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(backendUrl("/users/me/preferences"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  if (!userRes.ok || !prefRes.ok) return null;

  const user = await userRes.json();
  const preferences = await prefRes.json();

  return { user, preferences };
}

export default async function SettingsPage() {
  const data = await getInitialData();

  if (data === null) {
    redirect("/login");
  }

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display mb-6 text-2xl font-semibold text-ink">Settings</h1>
        <SettingsForm initialUser={data.user} initialPreferences={data.preferences} />
      </div>
    </div>
  );
}
