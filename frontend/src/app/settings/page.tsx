import { redirect } from "next/navigation";
import { getSessionToken, backendUrl } from "@/lib/session";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ConnectedCalendars } from "@/components/settings/ConnectedCalendars";
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
    <div className="flex-1 px-6 py-8 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Settings</h1>
          <p className="mt-1 text-xs text-ink-soft">
            Manage your profile, study parameters, and external calendar connections.
          </p>
        </div>
        <SettingsForm initialUser={data.user} initialPreferences={data.preferences} />
        <div className="mt-8">
          <ConnectedCalendars />
        </div>
      </div>
    </div>
  );
}
