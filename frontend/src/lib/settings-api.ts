export interface Preferences {
  id: number;
  user_id: number;
  preferred_study_start: string;
  preferred_study_end: string;
  max_session_minutes: number;
  min_session_minutes: number;
  break_minutes: number;
  buffer_minutes: number;
  allow_auto_reschedule: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

export interface PreferencesInput {
  preferred_study_start?: string;
  preferred_study_end?: string;
  max_session_minutes?: number;
  min_session_minutes?: number;
  break_minutes?: number;
  buffer_minutes?: number;
  allow_auto_reschedule?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
}

export interface ProfileInput {
  full_name?: string;
  timezone?: string;
  study_goal_minutes_per_week?: number;
}

async function parseOrThrow(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail.map((d: { msg: string }) => d.msg).join(", ")
      : data.detail ?? "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function getPreferences(): Promise<Preferences> {
  const response = await fetch("/api/settings/preferences", { cache: "no-store" });
  return parseOrThrow(response);
}

export async function updatePreferences(input: PreferencesInput): Promise<Preferences> {
  const response = await fetch("/api/settings/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}

export async function updateProfile(input: ProfileInput) {
  const response = await fetch("/api/settings/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(response);
}
